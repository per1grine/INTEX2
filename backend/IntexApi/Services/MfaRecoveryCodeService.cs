using BCrypt.Net;
using System.Security.Cryptography;

namespace IntexApi.Services;

public interface IMfaRecoveryCodeService
{
    string[] GenerateCodes(int count = 8);
    string Hash(string code);
    bool Verify(string code, string hash);
}

public sealed class MfaRecoveryCodeService : IMfaRecoveryCodeService
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public string[] GenerateCodes(int count = 8)
    {
        var codes = new string[count];
        for (var i = 0; i < count; i++)
            codes[i] = $"{GenerateChunk(4)}-{GenerateChunk(4)}";

        return codes;
    }

    public string Hash(string code) => BCrypt.Net.BCrypt.HashPassword(Normalize(code));

    public bool Verify(string code, string hash) => BCrypt.Net.BCrypt.Verify(Normalize(code), hash);

    private static string GenerateChunk(int length)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var chars = new char[length];
        for (var i = 0; i < length; i++)
            chars[i] = Alphabet[bytes[i] % Alphabet.Length];

        return new string(chars);
    }

    private static string Normalize(string code) =>
        new(code.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());
}
