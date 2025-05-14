import React, { useContext, useEffect, useState } from "react";
import { Web3Context } from "contexts/Web3Context";

function Dashboard() {
  const { contract } = useContext(Web3Context);
  const [value, setValue] = useState();

  useEffect(() => {
    if (contract) {
      contract.value().then(setValue);
    }
  }, [contract]);

  const update = async () => {
    if (contract) {
      const tx = await contract.setValue(123);
      await tx.wait();
      setValue(await contract.value());
    }
  };

  return (
    <div>
      <h2>Contract Value: {value}</h2>
      <button onClick={update}>Set to 123</button>
    </div>
  );
}
