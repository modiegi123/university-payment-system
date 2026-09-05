using System.ComponentModel.DataAnnotations;

namespace UniversityPaymentSystem.DotNet.DTOs
{
    public class AuthorizePaymentRequestDto
    {
        [Required]
        public Guid RegistrationCycleId { get; set; }

        [Required]
        public string SelectedCampus { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "At least one subject must be selected")]
        public List<SubjectSelectionDto> SelectedSubjects { get; set; } = new List<SubjectSelectionDto>();

        [Required]
        public BankingDetailsDto BankingDetails { get; set; } = new BankingDetailsDto();

        public ResidenceApplicationDto? ResidenceApplication { get; set; }
    }

    public class SubjectSelectionDto
    {
        [Required]
        public string SubjectId { get; set; } = string.Empty;
    }

    public class BankingDetailsDto
    {
        [Required]
        [StringLength(20, MinimumLength = 8)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string AccountHolder { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [StringLength(10, MinimumLength = 3)]
        public string BranchCode { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(savings|cheque|current)$", ErrorMessage = "Account type must be savings, cheque, or current")]
        public string AccountType { get; set; } = string.Empty;
    }

    public class ResidenceApplicationDto
    {
        public bool Applied { get; set; }
        public string? ResidenceType { get; set; }
        public List<string> Preferences { get; set; } = new List<string>();
    }

    public class PaymentResponseDto
    {
        public Guid Id { get; set; }
        public string PaymentReference { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string SelectedCampus { get; set; } = string.Empty;
        public List<SubjectSelectionResponseDto> SelectedSubjects { get; set; } = new List<SubjectSelectionResponseDto>();
        public ResidenceApplicationDto? ResidenceApplication { get; set; }
        public PaymentSummaryDto PaymentSummary { get; set; } = new PaymentSummaryDto();
        public AuthorizationDetailsDto? AuthorizationDetails { get; set; }
        public CaptureDetailsDto? CaptureDetails { get; set; }
        public RefundDetailsDto? RefundDetails { get; set; }
        public string? FailureReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SubjectSelectionResponseDto
    {
        public string SubjectId { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int Credits { get; set; }
        public decimal Fee { get; set; }
    }

    public class PaymentSummaryDto
    {
        public decimal RegistrationFee { get; set; }
        public decimal SubjectFees { get; set; }
        public decimal ResidenceFee { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal LateFee { get; set; }
    }

    public class AuthorizationDetailsDto
    {
        public string AuthorizationCode { get; set; } = string.Empty;
        public DateTime AuthorizedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class CaptureDetailsDto
    {
        public string CaptureCode { get; set; } = string.Empty;
        public DateTime CapturedAt { get; set; }
        public string TransactionId { get; set; } = string.Empty;
    }

    public class RefundDetailsDto
    {
        public string RefundReference { get; set; } = string.Empty;
        public DateTime RefundedAt { get; set; }
        public decimal RefundAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class RefundRequestDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue, ErrorMessage = "Refund amount must be positive")]
        public decimal? Amount { get; set; }
    }

    public class RefundResponseDto
    {
        public Guid PaymentId { get; set; }
        public string RefundReference { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class TransactionResponseDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string? ExternalTransactionId { get; set; }
        public string? FailureReason { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public PaymentResponseDto Payment { get; set; } = new PaymentResponseDto();
    }

    public class PaginatedResponseDto<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalItems { get; set; }
        public int PageSize { get; set; }
    }
}


