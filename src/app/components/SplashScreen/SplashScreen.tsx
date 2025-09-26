import './SplashScreen.css';

const SplashLogo = () => (
  <svg className="splash-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50,5 L50,95 M5,50 L95,50" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <SplashLogo />
    </div>
  );
};

export default SplashScreen;
