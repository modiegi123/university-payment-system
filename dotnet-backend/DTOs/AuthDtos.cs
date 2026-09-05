using System.ComponentModel.DataAnnotations;

namespace UniversityPaymentSystem.DotNet.DTOs
{
    public class RegisterRequestDto
    {
        [Required]
        [StringLength(20, MinimumLength = 6)]
        [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Student number must contain only uppercase letters and numbers")]
        public string StudentNumber { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Phone]
        public string? WhatsAppNumber { get; set; }
    }

    public class LoginRequestDto
    {
        [Required]
        public string StudentNumber { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public StudentDto Student { get; set; } = new StudentDto();
        public string Message { get; set; } = string.Empty;
    }

    public class StudentDto
    {
        public Guid Id { get; set; }
        public string StudentNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string? WhatsAppNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class UpdateProfileRequestDto
    {
        [StringLength(50, MinimumLength = 2)]
        public string? FirstName { get; set; }

        [StringLength(50, MinimumLength = 2)]
        public string? LastName { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        [Phone]
        public string? WhatsAppNumber { get; set; }
    }
}


