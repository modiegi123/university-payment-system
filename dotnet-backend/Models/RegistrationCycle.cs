using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniversityPaymentSystem.DotNet.Models
{
    public class RegistrationCycle
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string AcademicYear { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Semester { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        // Complex types for fees and banking details
        [Column(TypeName = "json")]
        public string FeesJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string BankingDetailsJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string CampusesJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string SubjectsJson { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

        // Helper properties for JSON deserialization
        [NotMapped]
        public RegistrationFees Fees
        {
            get => System.Text.Json.JsonSerializer.Deserialize<RegistrationFees>(FeesJson) ?? new RegistrationFees();
            set => FeesJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public BankingDetails BankingDetails
        {
            get => System.Text.Json.JsonSerializer.Deserialize<BankingDetails>(BankingDetailsJson) ?? new BankingDetails();
            set => BankingDetailsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<Campus> Campuses
        {
            get => System.Text.Json.JsonSerializer.Deserialize<List<Campus>>(CampusesJson) ?? new List<Campus>();
            set => CampusesJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<Subject> Subjects
        {
            get => System.Text.Json.JsonSerializer.Deserialize<List<Subject>>(SubjectsJson) ?? new List<Subject>();
            set => SubjectsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public class RegistrationFees
    {
        public decimal RegistrationFee { get; set; }
        public decimal? LateRegistrationFee { get; set; }
        public decimal? ResidenceApplicationFee { get; set; }
    }

    public class BankingDetails
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string BranchCode { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
    }

    public class Campus
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class Subject
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Credits { get; set; }
        public decimal Fee { get; set; }
        public string Campus { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}


