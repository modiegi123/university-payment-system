using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniversityPaymentSystem.DotNet.Models
{
    public class Payment
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid RegistrationCycleId { get; set; }

        [Required]
        [StringLength(50)]
        public string PaymentReference { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, authorized, captured, failed, refunded, cancelled

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "ZAR";

        // Encrypted banking details stored as JSON
        [Column(TypeName = "json")]
        public string BankingDetailsJson { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string SelectedCampus { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string SelectedSubjectsJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string ResidenceApplicationJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string PaymentSummaryJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string AuthorizationDetailsJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string CaptureDetailsJson { get; set; } = string.Empty;

        [Column(TypeName = "json")]
        public string RefundDetailsJson { get; set; } = string.Empty;

        [StringLength(500)]
        public string? FailureReason { get; set; }

        [Column(TypeName = "json")]
        public string MetadataJson { get; set; } = "{}";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; } = null!;

        [ForeignKey("RegistrationCycleId")]
        public virtual RegistrationCycle RegistrationCycle { get; set; } = null!;

        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

        // Helper properties for JSON deserialization
        [NotMapped]
        public EncryptedBankingDetails BankingDetails
        {
            get => System.Text.Json.JsonSerializer.Deserialize<EncryptedBankingDetails>(BankingDetailsJson) ?? new EncryptedBankingDetails();
            set => BankingDetailsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<SubjectSelection> SelectedSubjects
        {
            get => System.Text.Json.JsonSerializer.Deserialize<List<SubjectSelection>>(SelectedSubjectsJson) ?? new List<SubjectSelection>();
            set => SelectedSubjectsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public ResidenceApplication? ResidenceApplication
        {
            get => string.IsNullOrEmpty(ResidenceApplicationJson) ? null : System.Text.Json.JsonSerializer.Deserialize<ResidenceApplication>(ResidenceApplicationJson);
            set => ResidenceApplicationJson = value != null ? System.Text.Json.JsonSerializer.Serialize(value) : string.Empty;
        }

        [NotMapped]
        public PaymentSummary PaymentSummary
        {
            get => System.Text.Json.JsonSerializer.Deserialize<PaymentSummary>(PaymentSummaryJson) ?? new PaymentSummary();
            set => PaymentSummaryJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public AuthorizationDetails? AuthorizationDetails
        {
            get => string.IsNullOrEmpty(AuthorizationDetailsJson) ? null : System.Text.Json.JsonSerializer.Deserialize<AuthorizationDetails>(AuthorizationDetailsJson);
            set => AuthorizationDetailsJson = value != null ? System.Text.Json.JsonSerializer.Serialize(value) : string.Empty;
        }

        [NotMapped]
        public CaptureDetails? CaptureDetails
        {
            get => string.IsNullOrEmpty(CaptureDetailsJson) ? null : System.Text.Json.JsonSerializer.Deserialize<CaptureDetails>(CaptureDetailsJson);
            set => CaptureDetailsJson = value != null ? System.Text.Json.JsonSerializer.Serialize(value) : string.Empty;
        }

        [NotMapped]
        public RefundDetails? RefundDetails
        {
            get => string.IsNullOrEmpty(RefundDetailsJson) ? null : System.Text.Json.JsonSerializer.Deserialize<RefundDetails>(RefundDetailsJson);
            set => RefundDetailsJson = value != null ? System.Text.Json.JsonSerializer.Serialize(value) : string.Empty;
        }

        [NotMapped]
        public Dictionary<string, object> Metadata
        {
            get => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(MetadataJson) ?? new Dictionary<string, object>();
            set => MetadataJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public class EncryptedBankingDetails
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountHolder { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string BranchCode { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // savings, cheque, current
    }

    public class SubjectSelection
    {
        public string SubjectId { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Credits { get; set; }
        public decimal Fee { get; set; }
    }

    public class ResidenceApplication
    {
        public bool Applied { get; set; }
        public string? ResidenceType { get; set; } // on-campus, off-campus
        public List<string> Preferences { get; set; } = new List<string>();
    }

    public class PaymentSummary
    {
        public decimal RegistrationFee { get; set; }
        public decimal SubjectFees { get; set; }
        public decimal ResidenceFee { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal LateFee { get; set; }
    }

    public class AuthorizationDetails
    {
        public string AuthorizationCode { get; set; } = string.Empty;
        public DateTime AuthorizedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class CaptureDetails
    {
        public string CaptureCode { get; set; } = string.Empty;
        public DateTime CapturedAt { get; set; }
        public string TransactionId { get; set; } = string.Empty;
    }

    public class RefundDetails
    {
        public string RefundReference { get; set; } = string.Empty;
        public DateTime RefundedAt { get; set; }
        public decimal RefundAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}


