using System.Security.Cryptography;
using System.Text;

namespace IntexApi.Services;

public interface IMfaTotpService
{
    string GenerateSecret();
    string BuildOtpAuthUri(string issuer, string accountName, string secret);
    bool VerifyCode(string secret, string code, int window = 1);
}

public sealed class MfaTotpService : IMfaTotpService
{
    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public string GenerateSecret()
    {
        return Base32Encode(RandomNumberGenerator.GetBytes(20));
    }

    public string BuildOtpAuthUri(string issuer, string accountName, string secret)
    {
        var issuerEncoded = Uri.EscapeDataString(issuer);
        var accountEncoded = Uri.EscapeDataString(accountName);
        return $"otpauth://totp/{issuerEncoded}:{accountEncoded}?secret={secret}&issuer={issuerEncoded}&digits=6&period=30";
    }

    public bool VerifyCode(string secret, string code, int window = 1)
    {
        var normalizedCode = new string(code.Where(char.IsDigit).ToArray());
        if (normalizedCode.Length != 6) return false;

        var secretBytes = Base32Decode(secret);
        var currentStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;

        for (long offset = -window; offset <= window; offset++)
        {
            var candidate = GenerateCode(secretBytes, currentStep + offset);
            if (CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(candidate),
                Encoding.ASCII.GetBytes(normalizedCode)))
            {
                return true;
            }
        }

        return false;
    }

    private static string GenerateCode(byte[] secretBytes, long counter)
    {
        Span<byte> counterBytes = stackalloc byte[8];
        for (var i = 7; i >= 0; i--)
        {
            counterBytes[i] = (byte)(counter & 0xff);
            counter >>= 8;
        }

        using var hmac = new HMACSHA1(secretBytes);
        var hash = hmac.ComputeHash(counterBytes.ToArray());
        var offset = hash[^1] & 0x0f;
        var binaryCode = ((hash[offset] & 0x7f) << 24)
                       | (hash[offset + 1] << 16)
                       | (hash[offset + 2] << 8)
                       | hash[offset + 3];

        return (binaryCode % 1_000_000).ToString("D6");
    }

    private static string Base32Encode(byte[] data)
    {
        var output = new StringBuilder((data.Length * 8 + 4) / 5);
        var bits = 0;
        var value = 0;

        foreach (var b in data)
        {
            value = (value << 8) | b;
            bits += 8;

            while (bits >= 5)
            {
                output.Append(Base32Alphabet[(value >> (bits - 5)) & 31]);
                bits -= 5;
            }
        }

        if (bits > 0)
            output.Append(Base32Alphabet[(value << (5 - bits)) & 31]);

        return output.ToString();
    }

    private static byte[] Base32Decode(string input)
    {
        var cleaned = input.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>(cleaned.Length * 5 / 8);
        var bits = 0;
        var value = 0;

        foreach (var ch in cleaned)
        {
            var idx = Base32Alphabet.IndexOf(ch);
            if (idx < 0) continue;

            value = (value << 5) | idx;
            bits += 5;

            if (bits < 8) continue;

            output.Add((byte)((value >> (bits - 8)) & 0xff));
            bits -= 8;
        }

        return output.ToArray();
    }
}
