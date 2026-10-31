import React from "react";

const sampleWinners = [
  { user: "••••••••21", amount: "5,070.00", age: "16 minutes ago" },
  { user: "••••••••08", amount: "6,420.00", age: "18 minutes ago" },
  { user: "••••••••63", amount: "10,000.00", age: "20 minutes ago" },
  { user: "••••••••14", amount: "11,100.00", age: "22 minutes ago" },
  { user: "••••••••37", amount: "3,850.50", age: "24 minutes ago" },
];

function WinnerCard({ winner }) {
  return <article className="nx-winner-item">
    <div className="nx-winner-card">
      <div className="text-sm font-black text-white">{winner.user} <span className="text-[#20D779]">won</span></div>
      <div className="mt-2 text-2xl sm:text-3xl font-black italic text-[#20D779]">GHS {winner.amount}</div>
      <div className="mt-1 text-sm font-bold text-white">in Sports</div>
    </div>
    <div className="mt-1 text-xs text-[#9CA3AF]">{winner.age}</div>
  </article>;
}

export default function HomeFooter() {
  const loop = [...sampleWinners, ...sampleWinners];
  return <footer className="nx-home-footer mt-8 -mx-3 sm:mx-0">
    <section className="nx-grand-winners" aria-label="Grand Prize Winners">
      <h2 className="px-4 sm:px-6 pt-5 pb-3 text-2xl font-black text-white">Grand Prize Winners</h2>
      <div className="nx-winner-marquee" aria-label="Sample winner highlights">
        <div className="nx-winner-track">{loop.map((winner, index) => <WinnerCard key={`${winner.user}-${index}`} winner={winner} />)}</div>
      </div>
    </section>

    <section className="nx-footer-branding">
      <div className="nx-partner-lockup">
        <div className="nx-footer-wordmark">Nexus<span>Bet</span></div>
        <div className="nx-partner-copy">Official Sports<br/>Betting Partner</div>
        <div className="nx-laliga-mark"><img src="/laliga-logo.jpeg" alt="LaLiga" /></div>
      </div>
      <div className="nx-payment-heading">Payment methods</div>
      <div className="nx-payment-methods">
        <div className="nx-payment-method"><img src="/payment-methods/mtn-momo.png" alt="MTN Mobile Money"/><span>MTN</span></div>
        <div className="nx-payment-method"><img src="/payment-methods/telecel-cash.png" alt="Telecel Cash"/><span>Telecel</span></div>
        <div className="nx-payment-method"><img src="/payment-methods/airteltigo-money.png" alt="AirtelTigo Money"/><span>AirtelTigo</span></div>
      </div>
      <p className="nx-responsible-copy">Age 18 and above only. Play Responsibly. Betting is addictive and can be psychologically harmful. NexusBet Ghana is licensed by the Gaming Commission of Ghana under License No 00002354</p>
      <div className="nx-footer-bottom"><span>18+</span><span>© {new Date().getFullYear()} NexusBet. All rights reserved.</span></div>
    </section>
  </footer>;
}
