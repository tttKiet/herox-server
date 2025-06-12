import React from "react";

export interface IHomeProps {
  children: React.ReactNode;
}

function Home({ children }: IHomeProps) {
  return <div>{children}</div>;
}

export default Home;
