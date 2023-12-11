// Import types for your contract methods and any props
import { useContract } from "./Context/ContractProvider";
import { BrowserProvider, Contract } from "ethers";
import React, { useState, useEffect } from "react";
import { createFhevmInstance } from "../fhevmjs";
import { PlayerData } from "./Player";
import './Registration.css';


// Define the shape of props expected by the Registration component
interface RegistrationProps {
  updateRegistration: (isRegistered: boolean) => void;
  updatePlayer: (playerData: PlayerData) => void;
}

const Registration: React.FC<RegistrationProps> = ({ updateRegistration, updatePlayer }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [playersLeft, setPlayersLeft] = useState<number | null>(null);

  const { contract, contractABI, contractAddress, setProvider, setContract, setIsRegistered } = useContract();

  useEffect(() => {
    const fetchPlayerCount = async () => {
      if (contract && isLoading) {
        try {
          await createFhevmInstance();
          // Ensure getPlayersLeftToRegister is defined in your contract type
          const playerCount: number = await contract.getPlayersLeftToRegister();
          console.log(`players left: ${playerCount}`);
          setPlayersLeft(playerCount);
          if (playerCount == 0) {
            console.log("all registered");
            updateRegistration(true);
            setIsRegistered(true);
          }
        } catch (error) {
          console.error("Error fetching player count:", error);
        }
      }
    };

    fetchPlayerCount();
    const intervalId = setInterval(fetchPlayerCount, 1000);

    return () => clearInterval(intervalId);
  }, [contract, isLoading]);

  const handleRegistration = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const newProvider = new BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const newContract = new Contract(contractAddress, contractABI, signer);

        setProvider(newProvider);
        setContract(newContract);

        const tx = await newContract.registerForGame();
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Registered for game");

        const playerData: PlayerData = {
          address: await signer.getAddress(),
          role: "",
          status: true,
          id: 0
        };

        updatePlayer(playerData);
        setIsLoading(true);
      } catch (error) {
        console.error("Could not connect to MetaMask:", error);
      }
    } else {
      console.error("Please install MetaMask to continue.");
    }
  };

  return (
    <div className="registration-background">
      <div className="container registration-box">
        {isLoading ? (
          <div className="loading">
            Loading, {playersLeft !== null ? `${playersLeft} players left to register` : ''}
          </div>
        ) : (
          <section className="hero is-fullheight">
            <div className="hero-body">
              <div className="container has-text-centered">
                <button className="button is-register" onClick={handleRegistration}>
                  Register for Game
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>

  );
};

export default Registration;
