import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * L'unico punto in cui entra recharts.
 *
 * Sta in un file suo perché lo carichiamo con React.lazy: la libreria pesa da
 * sola più di tutto il resto dell'app, e chi apre GYM BUDDY per registrare una
 * serie non deve scaricarla. Arriva quando si apre la scheda Progressi.
 */
export default function Grafico({ dati, chiave, colore = "#FF2D3E", formato, formatoAsse }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={190}>
        {/* il margine destro tiene dentro l'ultima etichetta dell'asse, che
            altrimenti esce dal grafico e si taglia a metà */}
        {/* Il margine sinistro negativo recupera lo spazio che l'asse Y non usa
            con i numeri corti. Un passo scritto 6:42 è più largo, quindi lì lo
            spazio serve tutto o la prima cifra si taglia. */}
        <LineChart data={dati} margin={{ top: 10, right: 26, left: formatoAsse ? 0 : -22, bottom: 0 }}>
          <CartesianGrid stroke="#1E2229" vertical={false} />
          <XAxis
            dataKey="etichetta" stroke="#ABA69A" tickLine={false}
            tick={{ fontSize: 11, fontFamily: "Space Mono, monospace" }}
          />
          <YAxis
            stroke="#ABA69A" tickLine={false} width={46}
            tick={{ fontSize: 11, fontFamily: "Space Mono, monospace" }}
            domain={formatoAsse ? ["dataMin - 10", "dataMax + 10"] : undefined}
            tickFormatter={formatoAsse}
          />
          <Tooltip
            contentStyle={{ background: "#0C0E11", border: "1px solid #262A31", borderRadius: 10, color: "#F7F5F0" }}
            labelStyle={{ color: "#ABA69A" }}
            formatter={formato}
          />
          {/* si disegna da sinistra: accompagna la lettura nel tempo */}
          <Line
            type="monotone" dataKey={chiave} stroke={colore} strokeWidth={2.5}
            dot={{ r: 3.5, fill: colore, strokeWidth: 0 }} activeDot={{ r: 5 }}
            animationDuration={280}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
