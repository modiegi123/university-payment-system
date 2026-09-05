using UniversityPaymentSystem.DotNet.Models;

namespace UniversityPaymentSystem.DotNet.Services
{
    public interface IJwtService
    {
        string GenerateToken(Student student);
        Guid? ValidateToken(string token);
        string GetStudentIdFromToken(string token);
    }
}


