"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Check, Gift, ShoppingBag, Leaf, Award, Star } from "lucide-react";

// --- REWARDS DATA ---
const rewardsData = [
  {
    points: 300,
    title: "₹50 Mobile Recharge",
    description: "Instant prepaid mobile recharge.",
  },
  {
    points: 600,
    title: "₹100 Mobile Recharge",
    description: "Instant prepaid mobile recharge.",
  },
  {
    points: 800,
    title: "₹50 Amazon Voucher",
    description: "Amazon gift voucher worth ₹50.",
  },
  {
    points: 1200,
    title: "₹100 Amazon Voucher",
    description: "Amazon gift voucher worth ₹100.",
  },
  {
    points: 2000,
    title: "Power Bank",
    description: "Portable charger for everyday use.",
  },
  {
    points: 2500,
    title: "Bluetooth Speaker",
    description: "Compact wireless speaker.",
  },
  {
    points: 3000,
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse.",
  },
  {
    points: 4500,
    title: "Wireless Earbuds",
    description: "True wireless earbuds.",
  },
  {
    points: 5000,
    title: "₹500 Amazon Voucher",
    description: "Amazon gift voucher worth ₹500.",
  },
  {
    points: 8000,
    title: "Smart Band",
    description: "Fitness tracker with health monitoring.",
  },
  {
    points: 12000,
    title: "₹1000 Amazon Voucher",
    description: "Amazon gift voucher worth ₹1000.",
  },
];


// --- MAIN COMPONENT ---
export default function RewardsPage() {
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [redeemedItems, setRedeemedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view rewards.");
        navigate("/login");
        setLoading(false);
        return;
      }

      try {
        // Fetch user stats from API
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setUserPoints(response.data.totalPoints || 0);
        
        // Initialize localStorage for redeemed rewards if not set
        if (!localStorage.getItem("redeemedRewards")) {
          localStorage.setItem("redeemedRewards", JSON.stringify([]));
        }
        const redeemedRewards =
          JSON.parse(localStorage.getItem("redeemedRewards")) || [];
        setRedeemedItems(redeemedRewards);
        setLoading(false);
      } catch (err) {
        console.error("API Error:", err.message);
        setError("Failed to fetch user data.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle reward redemption
  const handleRedeemClick = (reward) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to redeem rewards.");
      navigate("/login");
      return;
    }

    const totalRedeemedPoints = redeemedItems.reduce(
      (acc, item) => acc + item.points,
      0
    );
    const pointsAfterRedemption = userPoints - totalRedeemedPoints;

    if (
      pointsAfterRedemption >= reward.points &&
      !redeemedItems.some((item) => item.title === reward.title)
    ) {
      try {
        // Update local state and localStorage
        const updatedPoints = pointsAfterRedemption - reward.points;
        const updatedRedeemedItems = [
          ...redeemedItems,
          {
            title: reward.title,
            description: reward.description,
            points: reward.points,
          },
        ];

        // Update localStorage
        localStorage.setItem("totalPoints", updatedPoints.toString());
        localStorage.setItem(
          "redeemedRewards",
          JSON.stringify(updatedRedeemedItems)
        );

        // Update local state
        setUserPoints(updatedPoints);
        setRedeemedItems(updatedRedeemedItems);
        setError(null);
      } catch (err) {
        console.error("Redeem Error:", err.message);
        setError("Failed to redeem reward. Please try again.");
      }
    } else {
      setError(
        pointsAfterRedemption < reward.points
          ? "Not enough points to redeem this reward."
          : "This reward has already been claimed."
      );
    }
  };

  // Calculate total points spent and remaining points
  const totalRedeemedPoints = redeemedItems.reduce(
    (acc, item) => acc + item.points,
    0
  );
  const pointsAfterRedemption = userPoints - totalRedeemedPoints;

  // Find the next available reward
  const nextReward = rewardsData.find((reward) => reward.points > userPoints);
  const progressPercentage = nextReward
    ? (userPoints / nextReward.points) * 100
    : 100;

  if (loading)
    return <div className="text-center text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 flex flex-col space-y-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Header and Points Summary */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
            Your Rewards Dashboard
          </h1>
          <p className="mt-1 text-gray-500 text-sm max-w-sm mx-auto">
            Redeem your points for exciting rewards and celebrate your progress!
          </p>
          <div className="mt-4 flex flex-col items-center">
            <p className="text-xs font-medium text-gray-400">
              Current Points Balance
            </p>
            <p className="text-5xl font-black bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mt-1">
              {pointsAfterRedemption}
            </p>
          </div>

          {/* Progress Bar */}
          {nextReward ? (
            <div className="mt-6 max-w-lg mx-auto">
              <p className="text-xs text-gray-600 mb-1 font-medium">
                You are{" "}
                <span className="font-bold text-red-600">
                  {nextReward.points - userPoints}
                </span>{" "}
                points away from{" "}
                <span className="font-semibold">{nextReward.title}</span>!
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-sm bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mt-6 font-semibold">
              You've unlocked all available rewards! Check back soon for more.
            </p>
          )}
        </div>

        {/* Main Content: Two Columns */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Rewards Column */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Available Rewards
            </h2>
            <div className="space-y-4">
              {rewardsData.map((reward) => {
                const canRedeem = pointsAfterRedemption >= reward.points;
                const isRedeemed = redeemedItems.some(
                  (item) => item.title === reward.title
                );

                return (
                  <div
                    key={reward.title}
                    className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 transform
                      ${
                        isRedeemed
                          ? "bg-green-50 border-green-200"
                          : canRedeem
                          ? "bg-white border-gray-100 hover:scale-[1.02] hover:shadow-lg"
                          : "bg-gray-50 border-gray-100 opacity-60"
                      }
                    `}
                  >
                    <div
                      className={`p-2 rounded-full transition-colors duration-300
                        ${
                          isRedeemed
                            ? "bg-green-200 text-green-700"
                            : "bg-red-100 text-red-600"
                        }
                      `}
                    >
                      {reward.icon}
                    </div>
                    <div className="flex-grow ml-3">
                      <p
                        className={`font-semibold text-base ${
                          isRedeemed ? "text-green-800" : "text-gray-800"
                        }`}
                      >
                        {reward.title}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isRedeemed ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {reward.description}
                      </p>
                    </div>

                    {/* Points and Redeem Button */}
                    <div className="flex flex-col items-end sm:items-center sm:flex-row sm:gap-2 ml-auto">
                      <p
                        className={`text-lg font-bold ${
                          isRedeemed ? "text-green-700" : "text-gray-800"
                        }`}
                      >
                        {reward.points}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          pts
                        </span>
                      </p>
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canRedeem || isRedeemed}
                        className={`px-4 py-1.5 rounded-full font-medium text-sm transition-all duration-300
                          ${
                            isRedeemed
                              ? "bg-green-500 text-white cursor-not-allowed shadow-md"
                              : canRedeem
                              ? "bg-gradient-to-r from-red-600 to-blue-600 text-white hover:from-red-700 hover:to-blue-700 shadow-md"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }
                        `}
                      >
                        {isRedeemed ? "Claimed" : "Redeem"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claimed Rewards Column */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Claimed Rewards
            </h2>
            <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 min-h-[150px]">
              {redeemedItems.length > 0 ? (
                redeemedItems.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="p-1.5 bg-green-200 text-green-700 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-green-800 text-sm">
                        {reward.title}
                      </p>
                      <p className="text-xs text-green-600">
                        {reward.description}
                      </p>
                    </div>
                    <span className="ml-auto text-lg font-bold text-green-700">
                      {reward.points}{" "}
                      <span className="text-xs font-normal text-gray-500">
                        pts
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-6">
                  <p className="font-medium text-sm">No rewards claimed yet.</p>
                  <p className="text-xs">Keep earning points to unlock them!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
