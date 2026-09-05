namespace UniversityPaymentSystem.DotNet.Services
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string encryptedText);
        string HashSensitiveData(string data);
        string GenerateSecureToken(int length = 32);
        string GeneratePaymentReference();
        string GenerateTransactionReference();
        string GenerateRefundReference();
    }
}


