import{r as x,j as e,c as T,R as z}from"./client-BJVKzfAi.js";import{s as k}from"./supabase-BoCLEw6R.js";import{A as B}from"./AdminHeader-tCInZd3n.js";import{E as F}from"./ErrorBoundary-9_HbXv1y.js";/* empty css             */import"./config-QPKPRtag.js";import"./auth-QZ4BJadW.js";import"./star-OtPMgcH9.js";import"./createLucideIcon-CgZZH2OU.js";import"./file-text-Bqp_Hw0X.js";import"./triangle-alert-Bp6DQQmR.js";import"./users-d0RSvnp4.js";import"./pen-line-Duo49k9O.js";import"./calendar-CDI4qHEX.js";import"./mail-CRbL90NL.js";import"./user-check-CoCGzn5Y.js";import"./dollar-sign-Dn2-KjNW.js";import"./send-C4mziT0-.js";import"./x-CrJVeoCh.js";function _({isOpen:i,onClose:g,onSend:h,emailData:s,loading:d=!1}){const m=x.useRef(null),f=x.useRef(null);return x.useEffect(()=>{const r=u=>{u.key==="Escape"&&i&&g()};return document.addEventListener("keydown",r),()=>document.removeEventListener("keydown",r)},[i,g]),x.useEffect(()=>(i?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[i]),x.useEffect(()=>{if(i&&f.current&&(s!=null&&s.htmlContent)){const r=f.current.contentDocument||f.current.contentWindow.document;r.open(),r.write(s.htmlContent),r.close()}},[i,s==null?void 0:s.htmlContent]),i?e.jsxs(e.Fragment,{children:[e.jsx("div",{onClick:g,style:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0, 0, 0, 0.5)",zIndex:999,transition:"opacity 0.3s ease"}}),e.jsxs("div",{ref:m,style:{position:"fixed",top:0,right:0,width:"680px",maxWidth:"100vw",height:"100vh",backgroundColor:"#fff",boxShadow:"-4px 0 24px rgba(0, 0, 0, 0.15)",zIndex:1e3,display:"flex",flexDirection:"column",animation:"slideInFromRight 0.3s ease"},children:[e.jsxs("div",{style:{padding:"20px 24px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",backgroundColor:"#F9FAFB"},children:[e.jsxs("div",{children:[e.jsx("h2",{style:{margin:0,fontSize:"18px",fontWeight:"600",color:"#111827"},children:"Email Preview"}),e.jsx("p",{style:{margin:"4px 0 0",fontSize:"13px",color:"#6B7280"},children:"Review the email before sending"})]}),e.jsx("button",{onClick:g,style:{background:"none",border:"none",padding:"8px",cursor:"pointer",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center"},onMouseOver:r=>r.target.style.backgroundColor="#E5E7EB",onMouseOut:r=>r.target.style.backgroundColor="transparent","aria-label":"Close preview",children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",children:e.jsx("path",{d:"M15 5L5 15M5 5l10 10",stroke:"#6B7280",strokeWidth:"2",strokeLinecap:"round"})})})]}),e.jsx("div",{style:{padding:"16px 24px",borderBottom:"1px solid #E5E7EB",backgroundColor:"#fff"},children:e.jsxs("div",{style:{display:"grid",gap:"12px"},children:[e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:"500",color:"#6B7280",minWidth:"60px"},children:"To:"}),e.jsx("span",{style:{fontSize:"13px",color:"#111827"},children:s!=null&&s.to_name?`${s.to_name} <${s==null?void 0:s.to_email}>`:s==null?void 0:s.to_email})]}),e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:"500",color:"#6B7280",minWidth:"60px"},children:"From:"}),e.jsxs("span",{style:{fontSize:"13px",color:"#111827"},children:[s==null?void 0:s.from_name," <",s==null?void 0:s.from_email,">"]})]}),e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("span",{style:{fontSize:"13px",fontWeight:"500",color:"#6B7280",minWidth:"60px"},children:"Subject:"}),e.jsx("span",{style:{fontSize:"13px",color:"#111827",fontWeight:"500"},children:s==null?void 0:s.subject})]})]})}),e.jsx("div",{style:{flex:1,overflow:"auto",backgroundColor:"#F3F4F6",padding:"24px"},children:e.jsx("div",{style:{backgroundColor:"#fff",borderRadius:"8px",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.1)",overflow:"hidden",maxWidth:"600px",margin:"0 auto"},children:e.jsx("iframe",{ref:f,title:"Email Preview",style:{width:"100%",minHeight:"500px",border:"none",display:"block"},sandbox:"allow-same-origin"})})}),e.jsxs("div",{style:{padding:"16px 24px",borderTop:"1px solid #E5E7EB",backgroundColor:"#F9FAFB",display:"flex",justifyContent:"flex-end",gap:"12px"},children:[e.jsx("button",{onClick:g,disabled:d,style:{padding:"10px 20px",fontSize:"14px",fontWeight:"500",backgroundColor:"#fff",color:"#374151",border:"1px solid #D1D5DB",borderRadius:"6px",cursor:d?"not-allowed":"pointer",transition:"all 0.2s ease"},onMouseOver:r=>{d||(r.target.style.backgroundColor="#F3F4F6")},onMouseOut:r=>{r.target.style.backgroundColor="#fff"},children:"Cancel"}),e.jsx("button",{onClick:h,disabled:d,style:{padding:"10px 24px",fontSize:"14px",fontWeight:"500",backgroundColor:d?"#9CA3AF":"#059669",color:"#fff",border:"none",borderRadius:"6px",cursor:d?"wait":"pointer",transition:"all 0.2s ease",display:"flex",alignItems:"center",gap:"8px"},onMouseOver:r=>{d||(r.target.style.backgroundColor="#047857")},onMouseOut:r=>{d||(r.target.style.backgroundColor="#059669")},children:d?e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",style:{animation:"spin 1s linear infinite"},children:e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2",strokeDasharray:"30 60"})}),"Sending..."]}):e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",children:e.jsx("path",{d:"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})}),"Send Email"]})})]})]}),e.jsx("style",{children:`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `})]}):null}function M({subject:i="Message from Split Lease",title:g="",bodytext1:h="",bodytext2:s="",button_url:d="https://splitlease.com",button_text:m="Visit Site",logourl:f="https://splitlease.com/assets/images/split-lease-logo.png",preheadertext:r="",warningmessage:u="",banner:b=""}){const p=y=>y?y.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):"";return`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${p(i)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style type="text/css">
    body { margin:0; padding:0; background:#f4f4f6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; display:block; }
    a { text-decoration:none; }
    .font-sans { font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 620px) {
      .container { width:100% !important; }
      .px-24 { padding-left:24px !important; padding-right:24px !important; }
      .stack { display:block !important; width:100% !important; }
    }
  </style>
</head>
<body class="font-sans" style="background:#f4f4f6;">
  <!-- Hidden preheader -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    ${p(r)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container" style="background:#ffffff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.05); overflow:hidden;">

          <!-- Header with Logo + Text -->
          <tr style="background:#4b2fa2;">
            <td align="center" style="padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-right:10px;">
                    <img src="${p(f)}" alt="Split Lease Logo" width="36" height="36" />
                  </td>
                  <td align="center" style="font-size:18px; font-weight:600; color:#ffffff; font-family:'Inter', sans-serif; letter-spacing:0.2px;">
                    Split Lease
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${u?`
          <!-- Warning Message Banner -->
          <tr>
            <td align="center" style="padding:16px 40px; background:#FEF3C7;">
              ${u}
            </td>
          </tr>
          `:""}

          ${b?`
          <!-- Banner -->
          <tr>
            <td align="center" style="padding:0;">
              ${b}
            </td>
          </tr>
          `:""}

          <!-- Message -->
          <tr>
            <td align="left" style="padding:36px 40px 28px 40px;">

              <h1 style="margin:0; font-size:20px; font-weight:600; color:#1a1a1a; line-height:1.5;">
                ${p(g)}
              </h1>
              <p style="margin:16px 0 20px 0; font-size:15px; line-height:1.6; color:#444;">
                ${p(h)}
              </p>

              <p style="margin:16px 0 20px 0; font-size:15px; line-height:1.6; color:#444;">
                ${p(s)}
              </p>
              <div style="text-align:center; margin:24px 0;">
                <a href="${p(d)}" target="_blank" style="display:inline-block; background:#4b2fa2; color:#ffffff; font-size:15px; font-weight:500; padding:12px 28px; border-radius:6px;">
                  ${p(m)}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px; font-size:12px; color:#999; line-height:1.6; background:#fafafa;">
              — The Split Lease Team<br/>
              Split Lease · Greater New York Area
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}function W(){const[i,g]=x.useState({}),[h,s]=x.useState({}),[d,m]=x.useState(!1),[f,r]=x.useState(null),[u,b]=x.useState(!1),p=()=>({template_id:"1756320055390x685004717147094100",to_email:"splitleasesharath@gmail.com",to_name:"Sharath",from_email:"tech@leasesplit.com",from_name:"Split Lease Tech",subject:"Test Email from Internal Test Page",variables:{title:"Test Email Title",bodytext1:"This is the first paragraph of the test email. It demonstrates that the email template system is working correctly.",bodytext2:"This is the second paragraph with additional information. Sent at: "+new Date().toLocaleString(),button_url:"https://splitlease.com",button_text:"Visit Split Lease",logourl:"https://splitlease.com/assets/images/split-lease-logo.png",preheadertext:"Test email from Split Lease Internal Test Page",warningmessage:"",banner:"",cc_email:"",bcc_email:"",message_id:"",in_reply_to:"",references:""}}),y=()=>{const t=p(),o=M({subject:t.subject,title:t.variables.title,bodytext1:t.variables.bodytext1,bodytext2:t.variables.bodytext2,button_url:t.variables.button_url,button_text:t.variables.button_text,logourl:t.variables.logourl,preheadertext:t.variables.preheadertext,warningmessage:t.variables.warningmessage,banner:t.variables.banner});r({...t,htmlContent:o}),m(!0)},v=async()=>{b(!0),s(t=>({...t,1:null}));try{const{data:{session:t}}=await k.auth.getSession(),o=p(),c=await(await fetch("https://qcfifybkaddcoimjroca.supabase.co/functions/v1/send-email",{method:"POST",headers:{Authorization:`Bearer ${(t==null?void 0:t.access_token)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmlmeWJrYWRkY29pbWpyb2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU0MDUsImV4cCI6MjA3NTA1MTQwNX0.glGwHxds0PzVLF1Y8VBGX0jYz3zrLsgE9KAWWwkYms8"}`,"Content-Type":"application/json"},body:JSON.stringify({action:"send",payload:{template_id:o.template_id,to_email:o.to_email,to_name:o.to_name,from_email:o.from_email,from_name:o.from_name,subject:o.subject,variables:o.variables}})})).json();c.success?(s(n=>{var l;return{...n,1:{success:!0,message:`Email sent! Message ID: ${((l=c.data)==null?void 0:l.message_id)||"N/A"}`}}}),console.log("[InternalTestPage] Email sent successfully:",c),m(!1)):(s(n=>({...n,1:{success:!1,message:c.error||"Unknown error"}})),console.error("[InternalTestPage] Email send failed:",c))}catch(t){s(o=>({...o,1:{success:!1,message:t.message}})),console.error("[InternalTestPage] Email send error:",t)}finally{b(!1)}},E=async()=>{g(t=>({...t,2:!0})),s(t=>({...t,2:null}));try{const{data:{session:t}}=await k.auth.getSession(),a=`Test SMS from Split Lease Internal Test Page. Sent at: ${new Date().toLocaleTimeString()}`,n=await(await fetch("https://qcfifybkaddcoimjroca.supabase.co/functions/v1/send-sms",{method:"POST",headers:{Authorization:`Bearer ${(t==null?void 0:t.access_token)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmlmeWJrYWRkY29pbWpyb2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU0MDUsImV4cCI6MjA3NTA1MTQwNX0.glGwHxds0PzVLF1Y8VBGX0jYz3zrLsgE9KAWWwkYms8"}`,"Content-Type":"application/json"},body:JSON.stringify({action:"send",payload:{to:"+13137575323",from:"+14155692985",body:a}})})).json();n.success?(s(l=>{var S;return{...l,2:{success:!0,message:`SMS queued! SID: ${((S=n.data)==null?void 0:S.message_sid)||"N/A"}`}}}),console.log("[InternalTestPage] SMS sent successfully:",n)):(s(l=>({...l,2:{success:!1,message:n.error||"Unknown error"}})),console.error("[InternalTestPage] SMS send failed:",n))}catch(t){s(o=>({...o,2:{success:!1,message:t.message}})),console.error("[InternalTestPage] SMS send error:",t)}finally{g(t=>({...t,2:!1}))}},I=t=>{console.log(`Button ${t} clicked`),s(o=>({...o,[t]:{success:!0,message:`Button ${t} clicked at ${new Date().toLocaleTimeString()}`}}))},w={1:{label:"Send Email",action:y,color:"#059669"},2:{label:"Send SMS",action:E,color:"#2563EB"}},C=(t,o)=>{const a=w[t],c=(a==null?void 0:a.color)||"#7C3AED",n=a!=null&&a.color?j(a.color):"#6D28D9";return{padding:"16px 24px",fontSize:"14px",fontWeight:"500",backgroundColor:i[t]?"#9CA3AF":o?n:c,color:"white",border:"none",borderRadius:"8px",cursor:i[t]?"wait":"pointer",transition:"all 0.2s ease",minHeight:"60px",transform:o&&!i[t]?"translateY(-2px)":"translateY(0)",opacity:i[t]?.7:1}},j=t=>{const o=parseInt(t.replace("#",""),16),a=Math.max(0,(o>>16)-25),c=Math.max(0,(o>>8&255)-25),n=Math.max(0,(o&255)-25);return`#${(a<<16|c<<8|n).toString(16).padStart(6,"0")}`};return e.jsxs(e.Fragment,{children:[e.jsx(B,{}),e.jsxs("main",{style:{maxWidth:"1200px",margin:"0 auto",padding:"40px 20px",minHeight:"calc(100vh - 200px)"},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"600",marginBottom:"16px",textAlign:"center"},children:"Internal Test Page"}),e.jsx("p",{style:{fontSize:"14px",color:"#6B7280",marginBottom:"32px",textAlign:"center"},children:"Test buttons for edge functions and internal functionality"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:"16px"},children:Array.from({length:25},(t,o)=>o+1).map(t=>{const o=w[t],a=(o==null?void 0:o.label)||`Button ${t}`,c=(o==null?void 0:o.action)||(()=>I(t));return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:[e.jsx("button",{onClick:c,disabled:i[t],style:C(t,!1),onMouseOver:n=>{if(!i[t]){const l=w[t];n.target.style.backgroundColor=l!=null&&l.color?j(l.color):"#6D28D9",n.target.style.transform="translateY(-2px)"}},onMouseOut:n=>{if(!i[t]){const l=w[t];n.target.style.backgroundColor=(l==null?void 0:l.color)||"#7C3AED",n.target.style.transform="translateY(0)"}},children:i[t]?"Sending...":a}),h[t]&&e.jsx("div",{style:{fontSize:"12px",padding:"8px",borderRadius:"4px",backgroundColor:h[t].success?"#D1FAE5":"#FEE2E2",color:h[t].success?"#065F46":"#991B1B",wordBreak:"break-word"},children:h[t].message})]},t)})}),e.jsxs("div",{style:{marginTop:"40px",padding:"20px",backgroundColor:"#F3F4F6",borderRadius:"8px",fontSize:"13px",color:"#4B5563"},children:[e.jsx("h3",{style:{fontSize:"14px",fontWeight:"600",marginBottom:"12px"},children:"Test Configuration"}),e.jsxs("ul",{style:{margin:0,paddingLeft:"20px",lineHeight:"1.8"},children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Send Email:"})," Opens preview sidebar → To: splitleasesharath@gmail.com"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Send SMS:"})," To: +1 (313) 757-5323 | From: +1 (415) 569-2985"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Email Template ID:"}),' 1756320055390x685004717147094100 ("General Email Template 4")']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Email Placeholders:"})," title, bodytext1, bodytext2, button_url, button_text, logourl, preheadertext"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"SMS Payload:"})," Direct Twilio proxy (to, from, body) - no templates"]})]})]})]}),e.jsx(_,{isOpen:d,onClose:()=>m(!1),onSend:v,emailData:f,loading:u})]})}T(document.getElementById("root")).render(e.jsx(z.StrictMode,{children:e.jsx(F,{children:e.jsx(W,{})})}));
