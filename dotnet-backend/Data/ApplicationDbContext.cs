using Microsoft.EntityFrameworkCore;
using UniversityPaymentSystem.DotNet.Models;

namespace UniversityPaymentSystem.DotNet.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<RegistrationCycle> RegistrationCycles { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Student configuration
            modelBuilder.Entity<Student>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.StudentNumber).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.PhoneNumber);
                
                entity.Property(e => e.StudentNumber)
                    .IsRequired()
                    .HasMaxLength(20);
                
                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.PhoneNumber)
                    .IsRequired()
                    .HasMaxLength(20);
                
                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.Property(e => e.WhatsAppNumber)
                    .HasMaxLength(20);
            });

            // RegistrationCycle configuration
            modelBuilder.Entity<RegistrationCycle>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.AcademicYear, e.Semester });
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => new { e.StartDate, e.EndDate });
                
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasMaxLength(500);
                
                entity.Property(e => e.AcademicYear)
                    .IsRequired()
                    .HasMaxLength(10);
                
                entity.Property(e => e.Semester)
                    .IsRequired()
                    .HasMaxLength(10);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => e.RegistrationCycleId);
                entity.HasIndex(e => e.PaymentReference).IsUnique();
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
                
                entity.Property(e => e.PaymentReference)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(20);
                
                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.Currency)
                    .IsRequired()
                    .HasMaxLength(3);
                
                entity.Property(e => e.SelectedCampus)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.Property(e => e.FailureReason)
                    .HasMaxLength(500);
                
                // Configure relationships
                entity.HasOne(e => e.Student)
                    .WithMany(s => s.Payments)
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.RegistrationCycle)
                    .WithMany(rc => rc.Payments)
                    .HasForeignKey(e => e.RegistrationCycleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Transaction configuration
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PaymentId);
                entity.HasIndex(e => e.StudentId);
                entity.HasIndex(e => new { e.Type, e.Status });
                entity.HasIndex(e => e.Reference).IsUnique();
                entity.HasIndex(e => e.CreatedAt);
                
                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(20);
                
                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(20);
                
                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)");
                
                entity.Property(e => e.Currency)
                    .IsRequired()
                    .HasMaxLength(3);
                
                entity.Property(e => e.Reference)
                    .IsRequired()
                    .HasMaxLength(50);
                
                entity.Property(e => e.ExternalTransactionId)
                    .HasMaxLength(100);
                
                entity.Property(e => e.FailureReason)
                    .HasMaxLength(500);
                
                // Configure relationships
                entity.HasOne(e => e.Payment)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(e => e.PaymentId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.Student)
                    .WithMany(s => s.Transactions)
                    .HasForeignKey(e => e.StudentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.Entity is Student student)
                {
                    if (entry.State == EntityState.Added)
                    {
                        student.CreatedAt = DateTime.UtcNow;
                    }
                    student.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.Entity is RegistrationCycle cycle)
                {
                    if (entry.State == EntityState.Added)
                    {
                        cycle.CreatedAt = DateTime.UtcNow;
                    }
                    cycle.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.Entity is Payment payment)
                {
                    if (entry.State == EntityState.Added)
                    {
                        payment.CreatedAt = DateTime.UtcNow;
                    }
                    payment.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.Entity is Transaction transaction)
                {
                    if (entry.State == EntityState.Added)
                    {
                        transaction.CreatedAt = DateTime.UtcNow;
                    }
                    transaction.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}


