import { Oval } from "react-loader-spinner";

const ButtonLoader = ({ color }) => {
  return (
    <Oval
      visible={true}
      height="28"
      width="28"
      color={`${color ? color : "white"}`}
      ariaLabel="oval-loading"
      wrapperStyle={{}}
      wrapperClass=""
    />
  );
};

export default ButtonLoader;
