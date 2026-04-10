using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;

namespace IntexApi.Services;

public interface IMfaChallengeService
{
    string Create(Guid userId);
    Guid? Validate(string token);
}

public sealed class MfaChallengeService(IDataProtectionProvider provider) : IMfaChallengeService
{
    private readonly IDataProtector _protector = provider.CreateProtector("mfa-login-challenge-v1");

    public string Create(Guid userId)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds();
        var nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(8));
        var payload = $"{userId:N}|{expiresAt}|{nonce}";
        var bytes = Encoding.UTF8.GetBytes(_protector.Protect(payload));
        return Convert.ToBase64String(bytes);
    }

    public Guid? Validate(string token)
    {
        try
        {
            var protectedPayload = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var payload = _protector.Unprotect(protectedPayload);
            var parts = payload.Split('|', 3);
            if (parts.Length < 2) return null;
            if (!Guid.TryParseExact(parts[0], "N", out var userId)) return null;
            if (!long.TryParse(parts[1], out var expiresAtUnix)) return null;
            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiresAtUnix) return null;
            return userId;
        }
        catch
        {
            return null;
        }
    }
}
