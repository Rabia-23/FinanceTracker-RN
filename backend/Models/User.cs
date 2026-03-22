using System;

namespace FinanceWebAPI.Models
{
   public class User
   {
      public int UserId { get; set; } // PRIMARY KEY
      public string Username { get; set; } = string.Empty; // kullanici adi
      public string Email { get; set; } = string.Empty; // email
      public string PasswordHash { get; set; } = string.Empty; // sifre (hashlenmis)
      public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // kullanici olusturma zamani
   }
}
