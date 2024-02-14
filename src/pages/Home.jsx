import React, { useEffect, useState } from "react";
import axios from "axios";
import eth from "../assets/eth.png";
import btc from "../assets/btc.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BarLoader } from "react-spinners";

function Home() {
  const [comparisonResult, setComparisonResult] = useState({});
  const [veloData, setVeloData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const aevoBtcResponse = await axios.get(
        "https://api.aevo.xyz/index?asset=BTC"
      );
      const aevoEthResponse = await axios.get(
        "https://api.aevo.xyz/index?asset=ETH"
      );
      const gmxResponseData = await axios.get(
        "https://gmx-avax-server.uc.r.appspot.com/tokens"
      );
      const gmxResponsePrices = await axios.get(
        "https://gmx-avax-server.uc.r.appspot.com/prices"
      );

      const gmxData = gmxResponseData.data;
      const gmxPrice = gmxResponsePrices.data;

      const gmxBTCData = gmxData.find((item) => item.data.symbol === "BTC");
      const gmxETHData = gmxData.find((item) => item.data.symbol === "ETH");
      const gmxBTCPrice = gmxPrice[gmxBTCData.id] * 10 ** -30;
      const gmxETHPrice = gmxPrice[gmxETHData.id] * 10 ** -30;

      // Format aevo responses with toFixed(3)
      const aevoBTCPrice = parseFloat(aevoBtcResponse.data.price).toFixed(3);
      const aevoETHPrice = parseFloat(aevoEthResponse.data.price).toFixed(3);

      // Perform comparison
      const result = {
        BTC: {
          GMX: gmxBTCPrice.toFixed(3),
          Aevo: aevoBTCPrice,
        },
        ETH: {
          GMX: gmxETHPrice.toFixed(3),
          Aevo: aevoETHPrice,
        },
      };
      setComparisonResult(result);
    } catch (error) {
      setError("Error fetching data.");
      console.error(error);
    }
  };

  const fetchVeloData = async () => {
    try {
      const response = await axios.get("http://localhost:3080/getFuturesData");

      console.log(response.data);
      setVeloData(response.data);
      console.log(veloData);
    } catch (error) {
      setError("Error fetching Velo data.");
      console.error(error);
    }
  };
  const saveToMongoDB = async () => {
    try {
      console.log("Velo Data to be saved:", veloData);

      const response = await axios.post(
        "http://localhost:3080/saveFuturesData",
        veloData
      );
      toast.success(response.data.message);
    } catch (error) {
      setError("Error saving Velo data to MongoDB.");
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
    fetchVeloData();
  }, []);
  return (
    <div className="min-h-screen bg-gray-200">
      <ToastContainer position="bottom-right" />
      <div className="">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4 text-center pb-10">XXX</h1>

          {error && <p className="text-red-500">{error}</p>}
          <div>
            <h1 className="text-xl font-bold mb-4  py-10">
              // Price from GMX and Aevo DEX
            </h1>
          </div>
          <div className="">
            <div className="flex gap-4">
              <Card title="BTC" data={comparisonResult.BTC} />
              <Card title="ETH" data={comparisonResult.ETH} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold mb-4  pt-10">
              // Save data to database
            </h1>
          </div>
          <div className="flex gap-10 mt-4">
            <button
              onClick={saveToMongoDB}
              disabled={!veloData} // Menonaktifkan tombol jika veloData tidak ada
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                !veloData && "opacity-50 cursor-not-allowed" // Menambahkan gaya saat tombol dinonaktifkan
              }`}
            >
              Save Velo Data to MongoDB
            </button>
          </div>

          <div>
            <h1 className="text-xl font-bold mb-4  pt-10">
              // Funding Rate and Trading Volume BTC and ETH from Velodata API
            </h1>
          </div>
          <div className="flex flex-col gap-10 pt-10">
            {veloData ? (
              <>
                <CoinSection coin="BTC" data={veloData.BTC} />
                <CoinSection coin="ETH" data={veloData.ETH} />
              </>
            ) : (
              <div className="flex h-48">
                <BarLoader color={"#4CAF50"} loading={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CoinSection = ({ coin, data }) => {
  return (
    <div className=" flex flex-col">
      {data &&
        data.map((item, index) => (
          <div
            key={index}
            className="mb-6 p-4 border border-gray-300 rounded bg-white shadow-md"
          >
            <h3 className="text-lg font-semibold mb-4">
              Product: {item.product}
            </h3>
            {item.data.length > 0 ? (
              item.data.map((subItem, subIndex) => (
                <div key={subIndex} className="flex flex-col mb-2">
                  <p className="text-gray-600">Exchange: {subItem.exchange}</p>
                  <p className="text-gray-600">
                    Time: {new Date(subItem.time).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Funding Rate: {subItem.funding_rate}
                  </p>
                  <p className="text-gray-600">
                    Trading Volume: {subItem.total_trades}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No data available</p>
            )}
          </div>
        ))}
    </div>
  );
};

const Card = ({ title, data }) => {
  // Tentukan URL gambar berdasarkan judul
  const imageUrl = title === "BTC" ? btc : eth;

  return (
    <div className=" lg:max-w-full lg:flex rounded-md">
      <div
        className="h-48 w-full lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-white"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover", // Ensure the background covers the entire element
          backgroundPosition: "center", // Center the background image
          padding: "10px", // Adjust the padding as needed
        }}
        title="Cryptocurrency Image"
      ></div>

      <div className="border-r border-b border-l  lg:border-l-0 lg:border-t S bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{title} Comparison</h2>
          <p>GMX Price: {data && data.GMX} USD</p>
          <p>Aevo Price: {data && data.Aevo} USD</p>

          <p className="font-semibold">
            Best Price:{" "}
            {data &&
              (data.GMX < data.Aevo ? (
                <span className="text-green-500">GMX</span>
              ) : (
                <span className="text-blue-500">Aevo</span>
              ))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
