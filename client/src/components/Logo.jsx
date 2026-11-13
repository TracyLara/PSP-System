import logoImg from '../assets/logo.png';

export default function Logo({ size = 40 }) {
  return (
    <img
      src={logoImg}
      alt=""
      className="logo-img"
      style={{ height: size, width: 'auto' }}
    />
  );
}