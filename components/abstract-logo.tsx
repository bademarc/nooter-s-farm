export const AbstractLogo = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-black rounded-full p-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#00FF00" />
          <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#00FF00" />
        </svg>
      </div>
      <span className="ml-2 text-white font-bold">Abstract</span>
    </div>
  )
}

