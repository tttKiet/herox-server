import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center min-h-16 py-6 px-6 bg-white shadow z-10 ">
      <div className="container mx-auto flex items-center">
        <div className="flex-shrink-0">
          <Image
            src="/logo/Cầm cờ (1).png"
            alt="Logo"
            width={64}
            height={50} // 64 / 1.278 ≈ 50
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <div className="ml-auto flex items-center gap-4">UPDATING...</div>
      </div>
    </header>
  );
}
