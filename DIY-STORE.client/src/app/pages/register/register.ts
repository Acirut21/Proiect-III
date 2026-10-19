import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { extractErrors } from '../../core/http-errors';

type Field = 'username' | 'email' | 'address' | 'password';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errors.set([]);

    this.auth.register(this.form.getRawValue()).subscribe({
      // Dupa inregistrare utilizatorul este deja autentificat; pagina de profil vine intr-o etapa urmatoare
      next: () => void this.router.navigateByUrl('/'),
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }

  protected showError(name: Field): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected emailMessage(): string {
    return this.form.controls.email.hasError('required')
      ? 'Email is required.'
      : 'Invalid email address.';
  }
}
