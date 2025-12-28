import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Trophy,
  Medal,
  Crown,
  ShieldCheck,
  User as UserIcon,
  Activity,
  TrendingUp,
  Search,
} from "lucide-react";

export default function Leaderboard() {
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  // Normalize userId from storage to handle potential wrapping quotes
  const currentUserId = localStorage.getItem("userId")?.replace(/["']/g, "");
  const userRole = localStorage.getItem("role") || "user";

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/top-members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Use monthlyPoints from your schema to rank users
        const rankedData = response.data
          .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
          .map((m, i) => ({
            ...m,
            rank: i + 1,
          }));

        setTopMembers(rankedData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Find the logged-in user in the ranked list
  const currentUserData = useMemo(() => {
    if (!currentUserId || topMembers.length === 0) return null;
    return topMembers.find((m) => String(m._id) === String(currentUserId));
  }, [topMembers, currentUserId]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={22} />;
    if (rank === 2) return <Medal className="text-slate-400" size={22} />;
    if (rank === 3) return <Medal className="text-amber-600" size={22} />;
    return <span className="text-xs font-bold text-slate-400">#{rank}</span>;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500 font-bold animate-pulse uppercase tracking-widest">
        Syncing Standings...
      </div>
    );

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${
        userRole === "responder"
          ? "bg-slate-950 text-slate-200"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-red-500/20">
            <Activity size={12} className="animate-pulse" /> Live System
            Leaderboard
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">
            {userRole === "responder" ? "System" : "Monthly"}{" "}
            <span className="text-red-600">Champions</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {userRole === "responder"
              ? "Overseeing top contributor performance and engagement."
              : "Recognizing top contributors in emergency response coordination."}
          </p>
        </div>

        {/* --- CONDITIONAL STATS CARD --- */}
        {userRole !== "responder" && (
          <div className="relative overflow-hidden rounded-3xl p-6 mb-8 border bg-white border-slate-200 shadow-xl shadow-red-900/5 transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-red-600/10 text-red-600">
                  <Trophy size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                    Your Current Standing
                  </p>
                  <h2 className="text-2xl font-black italic">
                    {currentUserData
                      ? `Rank #${currentUserData.rank}`
                      : "Unranked"}
                  </h2>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-2xl font-black text-red-600">
                    {(currentUserData?.Points || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Monthly Points
                  </p>
                </div>
                <div className="text-center border-l border-slate-200/20 pl-8">
                  <p className="text-2xl font-black text-blue-500">
                    {currentUserData?.reportsThisMonth || 0}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    Reports Made
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5">
              <TrendingUp size={180} />
            </div>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Find a contributor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
              userRole === "responder"
                ? "bg-slate-900 border-slate-800 text-white focus:border-red-500"
                : "bg-white border-slate-200 text-slate-800 focus:border-red-500 shadow-sm"
            }`}
          />
        </div>

        {/* LEADERBOARD LIST */}
        <div
          className={`rounded-3xl border shadow-2xl overflow-hidden ${
            userRole === "responder"
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="divide-y divide-slate-200/10">
            {topMembers
              .filter((m) =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((member) => {
                const isMe = String(member._id) === String(currentUserId);
                return (
                  <div
                    key={member._id}
                    className={`flex items-center px-6 py-4 transition-all hover:bg-slate-500/5 ${
                      isMe && userRole !== "responder"
                        ? "bg-red-500/5 border-l-4 border-red-500"
                        : ""
                    }`}
                  >
                    <div className="w-10 shrink-0">
                      {getRankIcon(member.rank)}
                    </div>

                    <div className="flex-1 flex items-center gap-4 overflow-hidden">
                      <div
                        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-xs border ${
                          member.rank === 1
                            ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-600"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p
                          className={`text-sm font-bold truncate flex items-center gap-2 ${
                            userRole === "responder"
                              ? "text-slate-200"
                              : "text-slate-800"
                          }`}
                        >
                          {isMe ? "You" : member.name}
                          {member.role === "responder" && (
                            <ShieldCheck size={12} className="text-blue-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                          {member.reportsThisMonth || 0} Incident Reports
                        </p>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-sm font-black text-red-600 tabular-nums">
                        {member.points.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none">
                        Pts
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
