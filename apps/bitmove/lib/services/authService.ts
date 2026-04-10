/**
 * authService.ts
 * Stub untuk validasi JWT token dari Flutter mobile app.
 * Dalam produksi, ini akan memverifikasi JWT menggunakan secret key.
 */

export async function validateMobileToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // TODO: Implementasi verifikasi JWT dengan library seperti 'jose' atau 'jsonwebtoken'
  // Contoh produksi:
  // const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
  // return payload.sub as string;

  // Sementara: stub yang mengembalikan token sebagai userId (HANYA UNTUK DEVELOPMENT)
  if (!token || token === "undefined") return null;

  // Uncomment baris ini saat implementasi JWT nyata sudah ada:
  // return decoded.userId;

  console.warn("[authService] validateMobileToken is using STUB mode — replace in production!");
  return token; // Stub: asumsikan token = userId
}
