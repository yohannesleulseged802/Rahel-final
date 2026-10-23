/**
 * Secure password and PIN hashing utilities using standard Web Crypto API (PBKDF2 with SHA-256).
 * Never stores plaintext passwords in Firestore, localStorage, or frontend code.
 */

// Generate a cryptographically secure random 16-byte hex salt
export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive a secure PBKDF2-SHA256 256-bit hash from text and salt (10,000 iterations)
export async function hashWithSalt(text: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(text),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash password with salt
export async function hashPassword(password: string, salt: string): Promise<string> {
  return hashWithSalt(password, salt);
}

// Verify password attempt against stored hash and salt
export async function verifyPassword(
  passwordAttempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!passwordAttempt || !salt || !expectedHash) return false;
  try {
    const computed = await hashWithSalt(passwordAttempt, salt);
    return computed === expectedHash;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

// Hash PIN with salt
export async function hashPin(pin: string, salt: string): Promise<string> {
  return hashWithSalt(pin, `pin_salt_${salt}`);
}

// Verify PIN attempt against stored hash and salt
export async function verifyPin(
  pinAttempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!pinAttempt || !salt || !expectedHash) return false;
  try {
    const computed = await hashPin(pinAttempt, salt);
    return computed === expectedHash;
  } catch (err) {
    console.error('PIN verification error:', err);
    return false;
  }
}
