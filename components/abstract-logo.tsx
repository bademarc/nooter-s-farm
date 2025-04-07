export const AbstractLogo = () => {
  return (
    <a 
      href="https://sepolia.abscan.org/"
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105"
    >
      <div className="relative overflow-hidden rounded-md shadow-lg">
        <img 
          src="/images/logo abs.jpg" 
          alt="Abstract Testnet Logo" 
          width={100} 
          height={24} 
          className="object-contain max-h-[24px] transition-transform hover:brightness-110"
          style={{ 
            filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))",
          }}
        />
      </div>
    </a>
  );
};

