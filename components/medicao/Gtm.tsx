import Script from 'next/script'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

/**
 * Consent Mode v2: o padrão negado é definido ANTES do GTM carregar.
 * Sem NEXT_PUBLIC_GTM_ID o componente não renderiza nada (ambiente local e testes).
 */
export function Gtm() {
  if (!GTM_ID || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return null
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- no App Router o beforeInteractive é suportado no layout raiz */}
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
        gtag('set','ads_data_redaction',true);
        gtag('set','url_passthrough',true);
        try{var c=JSON.parse(localStorage.getItem('big_consent')||'null');if(c){var s=function(v){return v?'granted':'denied'};gtag('consent','update',{analytics_storage:s(c.estatistica),ad_storage:s(c.marketing),ad_user_data:s(c.marketing),ad_personalization:s(c.marketing)});}}catch(e){}
      `}</Script>
      <Script id="gtm" strategy="afterInteractive">{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
      `}</Script>
    </>
  )
}
