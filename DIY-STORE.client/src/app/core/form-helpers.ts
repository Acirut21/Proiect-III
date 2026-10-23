import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Camp obligatoriu care nu accepta doar spatii (la fel ca validarea de pe server). */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim().length > 0 ? null : { required: true };

/** Numar intreg (pentru stoc). Campurile goale le trateaza validatorul `required`. */
export const wholeNumber: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { integer: true };
};

/**
 * Mesajul de afisat pentru un camp: primul validator picat, dupa ce utilizatorul a atins campul.
 * `messages` leaga numele validatorului ("required", "min", ...) de textul afisat.
 */
export function messageFor(control: AbstractControl, messages: Record<string, string>): string | null {
  if (control.valid || !(control.touched || control.dirty)) return null;
  const key = Object.keys(control.errors ?? {})[0];
  return (key && messages[key]) || 'Invalid value.';
}

/** Eroarea 404 de la API (elementul cerut nu exista). */
export function isNotFound(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 404;
}
