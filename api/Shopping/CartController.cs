using DiyStore.Api.Auth;
using Microsoft.AspNetCore.Mvc;

namespace DiyStore.Api.Shopping;

/// <summary>
/// Cosul se tine in browser (ca sesiunea din aplicatia veche); API-ul doar il verifica si il calculeaza
/// cu preturile si stocurile reale. Public: si vizitatorii isi pot vedea cosul.
/// </summary>
[ApiController]
[Route("api/cart")]
public class CartController(CartCalculator calculator) : ControllerBase
{
    private const int MaxLines = 100;
    private const int MaxQuantity = 1000;

    [HttpPost("summary")]
    public async Task<ActionResult<CartSummaryDto>> Summary(CartRequest request)
    {
        if (request.Items.Count > MaxLines)
            return BadRequest(new ErrorResponse([$"A cart can hold at most {MaxLines} different products."]));
        if (request.Items.Any(i => i.Quantity < 1 || i.Quantity > MaxQuantity))
            return BadRequest(new ErrorResponse([$"Quantity must be between 1 and {MaxQuantity}."]));

        return await calculator.BuildAsync(request.Items, request.DeliveryMethod);
    }
}
