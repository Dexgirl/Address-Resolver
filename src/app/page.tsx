"use client";
import { useState } from "react";

interface ResolvedAddress {
  address: string;
  balance: string;
  isContract: boolean;
}

export default function Home() {
  const [partialAddress, setPartialAddress] = useState("");
  const [results, setResults] = useState<ResolvedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resolveAddress = async () => {
    if (!partialAddress) {
      setError("Please enter a partial address");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partialAddress }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.matches || []);
      }
    } catch (resolveError) {
      setError("Failed to resolve address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    alert("Address copied to clipboard!");
  };

  return (
    <div className="container">
      <div className="header">
        <h1> AddressResolver</h1>
        <p>Resolve incomplete wallet addresses and prevent phishing</p>
      </div>

      <div className="card">
        <h3>Enter Partial Address</h3>
        <p className="info">
          Paste incomplete address like: <code>0xc42...e9dff</code>
        </p>

        <div className="input-group">
          <input
            className="input-field"
            type="text"
            value={partialAddress}
            onChange={(e) => setPartialAddress(e.target.value)}
            placeholder="e.g., 0xc42...e9dff"
          />
          <button
            className="btn btn-primary"
            onClick={resolveAddress}
            disabled={loading}
          >
            {loading ? "Resolving..." : "Resolve Address"}
          </button>
        </div>

        {error && (
          <div className="error-box">
             {error}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="card">
          <h3> Found {results.length} Matching Address{results.length > 1 ? "es" : ""}</h3>

          {results.map((result, index) => (
            <div key={index} className="result-item">
              <div className="address-container">
                <code className="address">{result.address}</code>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => copyToClipboard(result.address)}
                >
                   Copy
                </button>
              </div>

              {result.balance && (
                <p className="balance">Balance: {result.balance} ETH</p>
              )}

              {result.isContract && (
                <span className="badge">Contract</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && partialAddress && !error && (
        <div className="card">
          <p className="no-results">No matching addresses found. Try a different pattern.</p>
        </div>
      )}

      <div className="card info-section">
        <h3>How to Use</h3>
        <ol>
          <li>Copy the incomplete address from leaderboard (e.g., <code>0xc42...e9dff</code>)</li>
          <li>Paste it in the input field above</li>
          <li>Click &quot;Resolve Address&quot; to find the complete address</li>
          <li>Copy the full address to your clipboard</li>
        </ol>

        <h3 style={{ marginTop: "2rem" }}> Anti-Phishing Features</h3>
        <ul>
          <li> Verifies addresses on blockchain</li>
          <li> Shows transaction history</li>
          <li> Detects contract addresses</li>
          <li> Displays current balance</li>
        </ul>
      </div>
    </div>
  );
}
