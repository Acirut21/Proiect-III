import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard as ProductCardModel } from '../../core/catalog.models';
import { FavoriteButton } from '../favorite-button/favorite-button';
import { ImageCarousel } from '../image-carousel/image-carousel';

/** Cardul unui produs din liste: imagine (galerie daca sunt mai multe), pret vechi taiat, insigna SALE. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, DecimalPipe, ImageCarousel, FavoriteButton],
  templateUrl: './product-card.html',
})
export class ProductCard {
  readonly product = input.required<ProductCardModel>();
  /** Varianta compacta folosita la produsele similare. */
  readonly compact = input(false);
}
