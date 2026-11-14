import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Toasts } from './shared/toast/toast';
import { Footer } from './layout/footer/footer';

@Component({
  imports: [RouterOutlet, Navbar, Footer, Toasts],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
