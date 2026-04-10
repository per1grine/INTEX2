using Microsoft.AspNetCore.DataProtection;

namespace IntexApi.Services;

public interface IMfaSecretProtector
{
    string Protect(string value);
    string? Unprotect(string protectedValue);
}

public sealed class MfaSecretProtector(IDataProtectionProvider provider) : IMfaSecretProtector
{
    private readonly IDataProtector _protector = provider.CreateProtector("mfa-secret-v1");

    public string Protect(string value) => _protector.Protect(value);

    public string? Unprotect(string protectedValue)
    {
        try
        {
            return _protector.Unprotect(protectedValue);
        }
        catch
        {
            return null;
        }
    }
}
