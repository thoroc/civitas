interface NavbarProps {
  text: string;
}

export const Navbar = (props: NavbarProps) => {
  const text = props.text ?? 'Civitas';

  return (
    <div className="navbar bg-base-100">
      <a className="btn text-xl">{text}</a>
    </div>
  );
};
