namespace DiyStore.Api.Domain;

public static class DeliveryMethodExtensions
{
    /// <summary>Numele metodelor bifate, in ordinea Courier, StorePickup (asa le schimba API-ul).</summary>
    public static List<string> ToNames(this DeliveryMethod methods)
    {
        var names = new List<string>();
        if (methods.HasFlag(DeliveryMethod.Courier)) names.Add(nameof(DeliveryMethod.Courier));
        if (methods.HasFlag(DeliveryMethod.StorePickup)) names.Add(nameof(DeliveryMethod.StorePickup));
        return names;
    }

    /// <summary>Citeste o singura metoda dupa nume ("Courier" sau "StorePickup").</summary>
    public static bool TryParseSingle(string? name, out DeliveryMethod method)
    {
        method = name switch
        {
            nameof(DeliveryMethod.Courier) => DeliveryMethod.Courier,
            nameof(DeliveryMethod.StorePickup) => DeliveryMethod.StorePickup,
            _ => DeliveryMethod.None
        };
        return method != DeliveryMethod.None;
    }
}
