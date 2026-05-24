using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FinanceWebAPI.DTOs;

namespace FinanceWebAPI.Services
{
   public class CurrencyService
   {
      private readonly HttpClient _httpClient;

      public CurrencyService(HttpClient httpClient)
      {
         _httpClient = httpClient;
      }

      public async Task<CurrencyDto> GetLatestCurrenciesAsync()
      {
         var url = "https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP,CHF";
         var response = await _httpClient.GetAsync(url);

         if (!response.IsSuccessStatusCode)
            throw new System.Exception("Failed to load currencies");

         var content = await response.Content.ReadAsStringAsync();
         using var jsonDoc = JsonDocument.Parse(content);
         var rates = jsonDoc.RootElement.GetProperty("rates");

         // 1 TRY = X doviz gelir, biz 1 doviz = Y TRY istiyoruz
         decimal usd = 1 / rates.GetProperty("USD").GetDecimal();
         decimal eur = 1 / rates.GetProperty("EUR").GetDecimal();
         decimal gbp = 1 / rates.GetProperty("GBP").GetDecimal();
         decimal chf = 1 / rates.GetProperty("CHF").GetDecimal();

         var lastUpdate = jsonDoc.RootElement.GetProperty("date").GetString() ?? "";

         // Altin fiyatlari: gercek zamanli API ucretli oldugu icin sabit deger
         decimal goldGram    = 3850.0m;
         decimal quarterGold = 6300.0m;
         decimal goldOunce   = 119700.0m;

         return new CurrencyDto
         {
            USD         = usd,
            EUR         = eur,
            GBP         = gbp,
            CHF         = chf,
            GoldGram    = goldGram,
            QuarterGold = quarterGold,
            GoldOunce   = goldOunce,
            LastUpdate  = lastUpdate
         };
      }
   }
}
