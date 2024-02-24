interface NavItemProps {
  text: string;
  href: string;
}

interface NavbarProps {
  brandName: string;
  navItems?: NavItemProps[];
}

export const Navbar = (props: NavbarProps) => {
  const text = props.brandName ?? 'Civitas';

  return (
    <div className="navbar bg-base-300">
      <div className="flex-none">
        <a className="btn text-xl" href="/">
          {text}
        </a>
      </div>
      <div role="tablist" className="tabs tabs-boxed">
        {props.navItems?.map((item, index) => (
          <a key={index} role="tab" className="tab" href={item.href}>
            {item.text}
          </a>
        ))}
      </div>
    </div>
  );
};
