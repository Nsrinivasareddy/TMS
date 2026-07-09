import React, { forwardRef } from "react";

const SingleBillCopy = ({ data, copyName }) => {
  if (!data) return null;
  const fDate = data.bdate ? new Date(data.bdate).toLocaleDateString('en-GB') : '';

  return (
    <div style={{
      height: "67mm",
      borderBottom: "1px dashed black",
      padding: "2mm 5mm",
      fontSize: "12px",
      fontFamily: "'Courier New', Courier, monospace",
      color: "black",
      position: "relative",
      backgroundColor: "white",
      overflow: "hidden"
    }}>
      {/* WATERMARK */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)",
        fontSize: "40px", color: "rgba(0,0,0,0.05)", fontWeight: "bold", zIndex: 0, pointerEvents: "none"
      }}>
        SRININASA ROAD TRANSPORT
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Line 1: Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "bold", borderBottom: "1.2px solid black", paddingBottom: "2px" }}>
          <span>SRININASA ROAD TRANSPORT</span>
          <span>{data.fstn} - {data.tstn}</span>
          <span>DATE: {fDate}</span>
          <span>LRNO: {data.lrno}-{data.arts}</span>
        </div>

        {/* Line 2: Consignor & Consignee */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", paddingBottom: "2px" }}>
          <div style={{ width: "50%" }}>
            <strong style={{ textDecoration: "underline" }}>CONSIGNOR:</strong> <strong>{data.cnorname}</strong><br />
            GSTNO: {data.cnorgstno}<br/>
            ADDR: {data.cnoraddr}<br />
            PHNO: {data.cnorphno}<br/>
          </div>
          <div style={{ width: "50%", borderLeft: "1px solid #ccc", paddingLeft: "8px" }}>
            <strong style={{ textDecoration: "underline" }}>CONSIGNEE:</strong> <strong>{data.cneename}</strong><br />
            GSTNO: {data.cneegstno} <br/>
            ADDR: {data.cneeaddr} <br/>
            PHNO: {data.cneephno}<br/>
          </div>
        </div>
        {/* Line 3: 6-Column Table */}
        <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", borderTop: "1.2px solid black", borderBottom: "1.2px solid black", marginTop: "2px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9f9f9" }}>
              <th width="8%" align="left" style={{ borderRight: "1px solid #ccc", padding: "2px" }}>Articles</th>
              <th width="57%" align="left" style={{ borderRight: "1px solid #ccc", padding: "2px" }}>Description</th>
              <th width="8%" align="right" style={{ borderRight: "1px solid #ccc", padding: "2px" }}>Weight</th>
              <th width="7%" align="right" style={{ borderRight: "1px solid #ccc", padding: "2px" }}>CDM</th>
              <th width="8%" align="right" style={{ borderRight: "1px solid #ccc", padding: "2px" }}>Freight</th>
              <th width="12%" align="right" style={{ padding: "2px" }}>Other Chgs</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ verticalAlign: "top" }}>
              <td align="left" style={{ borderRight: "1px solid #ccc", padding: "4px 2px", fontWeight: "bold" }}>{data.arts}</td>
              <td align="left" style={{ borderRight: "1px solid #ccc", padding: "4px 2px" }}>
                <div style={{ fontWeight: "bold", fontSize: "12px" }}>{data.desc1}</div><br/><br/>

                {/* Description లోకి పంపబడిన వివరాలు */}
                <div style={{ marginTop: "4px", fontSize: "10px", lineHeight: "1.3" }}>
                  Value: <strong>{data.cmentval} /-</strong>
                  <strong>{data.rcm === 'Y' ? 'RCM APPLY' : ''}</strong><br/>
                  <span style={{ border: "1px solid black", padding: "0 2px", marginRight: "5px" }}>{copyName}</span>
                  <span style={{ border: "1px solid black", padding: "0 2px", marginRight: "5px" }}>{(data.paytype || "TOPAY").toUpperCase()}</span>
                 <strong> TOTAL: {Number(data.total || 0).toFixed(2)}</strong> 
                </div>
              </td>
              <td align="right" style={{ borderRight: "1px solid #ccc", padding: "4px 2px", fontWeight: "bold" }}>{data.weight}</td>
              <td align="right" style={{ borderRight: "1px solid #ccc", padding: "4px 2px", fontWeight: "bold" }}>{Number(data.cdm || 0)}</td>
              <td align="right" style={{ borderRight: "1px solid #ccc", padding: "4px 2px", fontWeight: "bold" }}>{Number(data.freight || 0).toFixed(2)}</td>
              <td align="right" style={{ padding: "4px 2px", fontSize: "9px" }}>
                LR:{Number(data.lrchg).toFixed(2)} <br/>
                Sur:{Number(data.surchg).toFixed(2)}<br/>
                Art:{Number(data.artchg).toFixed(2)} <br/>
                Val:{Number(data.valchg).toFixed(2)}<br/>
                WP:{Number(data.wpchg).toFixed(2)} <br/>
                DDC:{Number(data.ddchg).toFixed(2)}<br/>
                Hwt:{Number(data.hweitChg).toFixed(2)}<br/>
             
              </td>
            </tr>
          </tbody>
        </table>

        {/* Line 4: Footer - కేవలం టోటల్ మాత్రమే */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: "5px" }}>
          <div style={{ textAlign: "right" }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LaserJetPrint = forwardRef(({ data }, ref) => {
  if (!data) return <div style={{ padding: "20px" }}>Loading Data...</div>;
  const copies = ["H.O. COPY", "CONSIGNOR COPY", "CONSIGNEE COPY", "VEHICLE COPY", "FILE COPY"];

  return (
    <div ref={ref} style={{ width: "210mm", backgroundColor: "white" }}>
      {copies.map((name, index) => (
        <SingleBillCopy key={index} data={data} copyName={name} />
      ))}
    </div>
  );
});

export const DotMatrixPrint = forwardRef(({ data }, ref) => {
  if (!data) return null;
  const fDate = data.bdate ? new Date(data.bdate).toLocaleDateString('en-GB') : '';
  const copies = ["HO", "CNOR", "CNEE", "VEH", "FILE"];

  return (
    <div ref={ref} style={{ background: "white", padding: "5mm", display: "block" }}>
      <pre style={{ fontSize: "12px", fontFamily: "monospace", lineHeight: "1.2", color: "black" }}>
        {copies.map(copy => {
          return `
SRININASA ROAD TRANSPORT (${copy})    ${(data.fstn + "-" + data.tstn).padEnd(15)}    Date: ${fDate}
LR:${data.lrno.toString().padEnd(10)} Arts:${data.arts.toString().padEnd(5)}  INFO: ${data.lrno}-${data.arts}
-------------------------------------------------------------------------------------
ARTICLES   DESCRIPTION (Val, RCM, Type)         WEIGHT    CDM    FREIGHT   OTHERS
${data.arts.toString().padEnd(10)} ${data.desc1.slice(0, 15).padEnd(15)} Val:${data.cmentval.toString().padEnd(10)} ${data.weight.toString().padEnd(9)} ${data.cdm.toString().padEnd(6)} ${Number(data.freight).toFixed(2).padEnd(9)} ${(data.total - data.freight).toFixed(2)}
-------------------------------------------------------------------------------------
TOTAL: ${Number(data.total).toFixed(2)}  PAYMENT: ${(data.paytype || "TOPAY")}
-------------------------------------------------------------------------------------`;
        }).join('\n')}
      </pre>
    </div>
  );
});
