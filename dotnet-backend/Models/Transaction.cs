using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniversityPaymentSystem.DotNet.Models
{
    public class Transaction
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PaymentId { get; set; }

        [Required]
        public Guid StudentId { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // authorization, capture, refund, reversal

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, success, failed, cancelled

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "ZAR";

        [Required]
        [StringLength(50)]
        public string Reference { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ExternalTransactionId { get; set; }

        [Column(TypeName = "json")]
        public string GatewayResponseJson { get; set; } = "{}";

        [StringLength(500)]
        public string? FailureReason { get; set; }

        public DateTime? ProcessedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("PaymentId")]
        public virtual Payment Payment { get; set; } = null!;

        [ForeignKey("StudentId")]
        public virtual Student Student { get; set; } = null!;

        // Helper property for JSON deserialization
        [NotMapped]
        public Dictionary<string, object> GatewayResponse
        {
            get => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(GatewayResponseJson) ?? new Dictionary<string, object>();
            set => GatewayResponseJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }
}


