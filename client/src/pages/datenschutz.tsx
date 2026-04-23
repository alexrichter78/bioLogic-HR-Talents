import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";
import { useLocalizedText, useRegion } from "@/lib/region";

export default function Datenschutz() {
  const t = useLocalizedText();
  const { region } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const it = region === "IT";

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
      <img src={logoPath} alt="bioLogic" style={{ height: 48, objectFit: "contain", marginBottom: 10 }} data-testid="img-datenschutz-logo" />
      <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 10 }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
    </div>
  );

  const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" };
  const pStyle: React.CSSProperties = { margin: "0 0 20px" };
  const pSmStyle: React.CSSProperties = { margin: "0 0 8px" };
  const ulStyle: React.CSSProperties = { margin: "0 0 8px", paddingLeft: 20 };
  const ulBotStyle: React.CSSProperties = { margin: "0 0 20px", paddingLeft: 20 };
  const linkStyle: React.CSSProperties = { color: "#3B82F6", textDecoration: "none" };

  return (
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-datenschutz"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {en ? "Back" : fr ? "Retour" : it ? "Indietro" : t("Zurück")}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          {header}

          {en ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">Privacy Policy</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. Controller</h2>
                <p style={pStyle}>The controller responsible for data processing within the meaning of the General Data Protection Regulation (GDPR) is:<br /><br />foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Germany<br />Email: info@foresmind.de<br />Phone: +49 (0)8343 / 338 998 – 1</p>
                <h2 style={h2Style}>2. General Information</h2>
                <p style={pStyle}>This software is used for analysing working styles, role requirements, and team constellations. The evaluations do not constitute automated decision-making within the meaning of Art. 22 GDPR and have no legal effect on the persons concerned. The results serve exclusively as a supporting basis for decisions. No profiling within the meaning of the GDPR takes place.</p>
                <h2 style={h2Style}>3. Types of Data Processed</h2>
                <p style={pSmStyle}>During use, the following data may be processed:</p>
                <ul style={ulStyle}><li>Login data (username, password in hashed form)</li><li>Role inputs (e.g. tasks, requirements)</li><li>Person inputs (e.g. assessments of working styles)</li><li>System-generated analysis results</li><li>Technical access data (IP address, browser type, access time)</li></ul>
                <p style={pStyle}>Analysis inputs and results are not permanently stored on a personal basis unless the user explicitly saves them.</p>
                <h2 style={h2Style}>4. No Permanent Storage of Analysis Data</h2>
                <p style={pStyle}>Analysis inputs and results are generally processed temporarily (session-based) without permanent storage of personal data. The provider does not identify individual persons based on analysis data.</p>
                <h2 style={h2Style}>5. SSL/TLS Encryption</h2>
                <p style={pStyle}>For security reasons and to protect the transmission of confidential content, this application uses SSL or TLS encryption. You can recognise an encrypted connection by the fact that the address bar of the browser changes from "http://" to "https://" and by the lock symbol in your browser bar.</p>
                <h2 style={h2Style}>6. Server Log Files</h2>
                <p style={pSmStyle}>The hosting provider automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are:</p>
                <ul style={ulStyle}><li>Browser type and browser version</li><li>Operating system used</li><li>Referrer URL</li><li>Hostname of the accessing computer</li><li>Time of the server request</li><li>IP address</li></ul>
                <p style={pStyle}>This data is not merged with other data sources. The basis for data processing is Art. 6 para. 1 lit. f GDPR (legitimate interest in technically error-free presentation and optimisation).</p>
                <h2 style={h2Style}>7. Use of the Software (SaaS)</h2>
                <p style={pStyle}>The application is designed as Software-as-a-Service (SaaS) and is used independently by customers. Responsibility for entering personal data lies with the respective user or the company using the software. Where the customer uses the software to process personal data of third parties (e.g. employees, applicants), the customer is themselves the data controller responsible for this processing under data protection law.</p>
                <h2 style={h2Style}>8. Use of Artificial Intelligence</h2>
                <p style={pSmStyle}>External AI provider services are used to generate evaluations, recommendations, and AI-supported coaching responses. The application uses two providers with clearly separated areas of responsibility:</p>
                <ul style={ulStyle}><li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong> – for generating role analyses (Rollen-DNA), comparison reports (MatchCheck), team dynamics evaluations, competency analyses, candidate profiles, and AI-generated images.</li><li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong> – for the AI coach "Louis", which conducts coaching conversations on leadership, recruiting, team dynamics, and communication.</li></ul>
                <p style={pSmStyle}>For both providers the following applies:</p>
                <ul style={ulStyle}><li>No independent profiling takes place by the respective provider</li><li>Processing serves exclusively to create text suggestions, analyses and coaching responses</li><li>No automated decisions within the meaning of Art. 22 GDPR are made</li><li>The transmitted data is not used to train AI models in accordance with the respective providers' terms of use (API usage)</li></ul>
                <p style={pStyle}>Through the use of both APIs, a transfer of data to the USA may occur (see section "Data Transfer to Third Countries").</p>
                <h2 style={h2Style}>9. Data Transfer to Third Countries</h2>
                <p style={pStyle}>Through the use of OpenAI, Anthropic, and where applicable the hosting provider, personal data may be transferred to the USA or other third countries. The transfer is made on the basis of Art. 49 para. 1 lit. a GDPR (consent through use) or Art. 49 para. 1 lit. b GDPR (contract performance) and, where available, on the basis of the EU-US Data Privacy Framework or comparable guarantees (e.g. standard contractual clauses pursuant to Art. 46 para. 2 lit. c GDPR).</p>
                <h2 style={h2Style}>10. Hosting</h2>
                <p style={pStyle}>The software is operated via external hosting service providers (e.g. Render, San Francisco, USA, or comparable providers). These process data exclusively within the scope of technically providing the application and act as processors within the meaning of Art. 28 GDPR.</p>
                <h2 style={h2Style}>11. Legal Bases</h2>
                <p style={pSmStyle}>The processing of personal data is carried out on the following legal bases:</p>
                <ul style={ulBotStyle}><li>Art. 6 para. 1 lit. a GDPR (consent – where given)</li><li>Art. 6 para. 1 lit. b GDPR (contract performance / use of the software)</li><li>Art. 6 para. 1 lit. f GDPR (legitimate interest in stable provision and improvement of the application)</li></ul>
                <h2 style={h2Style}>12. Disclosure of Data</h2>
                <p style={pSmStyle}>Personal data is disclosed exclusively:</p>
                <ul style={ulStyle}><li>to technically necessary service providers (hosting, AI processing)</li><li>where required by law or necessary for the enforcement of legal claims</li></ul>
                <p style={pStyle}>No further disclosure to third parties, in particular for advertising or marketing purposes, takes place.</p>
                <h2 style={h2Style}>13. Cookies and Local Storage</h2>
                <p style={pSmStyle}>The application uses only technically necessary cookies and local storage (localStorage) to manage sessions and enable the use of the application. No cookies for tracking, analytics, or marketing purposes are used. Consent is not required for technically necessary cookies pursuant to § 25 para. 2 TDDDG.</p>
                <p style={pSmStyle}>The following data is stored in local storage:</p>
                <ul style={ulBotStyle}><li>User settings (e.g. region selection) – permanently until manually changed</li><li>Intermediate states of ongoing workflows (e.g. role analysis, JobCheck, TeamCheck) – temporary, deleted when the respective process is reset or completed</li><li>Cached AI results (e.g. generated texts) – temporary, only for the current session</li></ul>
                <h2 style={h2Style}>14. Retention Periods</h2>
                <p style={pStyle}>Personal data is only stored for as long as necessary for the respective processing purpose or as required by statutory retention obligations. User accounts can be deleted at any time upon request. Analysis inputs and results are generally not stored permanently.</p>
                <h2 style={h2Style}>15. Rights of Data Subjects</h2>
                <p style={pSmStyle}>You have the following rights under the GDPR:</p>
                <ul style={ulStyle}><li>Right of access (Art. 15 GDPR)</li><li>Right to rectification (Art. 16 GDPR)</li><li>Right to erasure (Art. 17 GDPR)</li><li>Right to restriction of processing (Art. 18 GDPR)</li><li>Right to data portability (Art. 20 GDPR)</li><li>Right to object (Art. 21 GDPR)</li><li>Right to withdraw consent (Art. 7 para. 3 GDPR)</li></ul>
                <p style={pStyle}>To exercise these rights, please contact: info@foresmind.de</p>
                <h2 style={h2Style}>16. Right to Lodge a Complaint with a Supervisory Authority</h2>
                <p style={pStyle}>Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a supervisory authority if you consider that the processing of your personal data infringes the GDPR. The competent supervisory authority is:<br /><br />Bavarian State Office for Data Protection Supervision (BayLDA)<br />Promenade 18<br />91522 Ansbach<br /><a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.lda.bayern.de</a></p>
                <h2 style={h2Style}>17. Classification Note</h2>
                <p style={pStyle}>The analyses provided describe recurring patterns in a work context, are to be understood in a value-neutral way, and do not represent fixed personality profiles. They do not replace individual assessment or decisions but serve exclusively as orientation.</p>
                <h2 style={h2Style}>18. Changes to this Privacy Policy</h2>
                <p style={pStyle}>We reserve the right to adapt this privacy policy to keep it in line with current legal requirements or to reflect changes to our services. The current privacy policy will apply upon your next visit.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>As of April 2026 · © {new Date().getFullYear()} foresMind® GmbH. All rights reserved.</p>
              </div>
            </>
          ) : fr ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">Politique de confidentialité</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. Responsable du traitement</h2>
                <p style={pStyle}>Le responsable du traitement des données au sens du Règlement général sur la protection des données (RGPD) est :<br /><br />foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Allemagne<br />E-mail : info@foresmind.de<br />Téléphone : +49 (0)8343 / 338 998 – 1</p>
                <h2 style={h2Style}>2. Informations générales</h2>
                <p style={pStyle}>Ce logiciel est utilisé pour analyser les styles de travail, les exigences des rôles et les constellations d'équipe. Les évaluations ne constituent pas de prises de décision automatisées au sens de l'Art. 22 du RGPD et n'ont aucun effet juridique sur les personnes concernées. Les résultats servent exclusivement de base d'aide à la décision. Aucun profilage au sens du RGPD n'a lieu.</p>
                <h2 style={h2Style}>3. Types de données traitées</h2>
                <p style={pSmStyle}>Dans le cadre de l'utilisation, les données suivantes peuvent être traitées :</p>
                <ul style={ulStyle}><li>Données de connexion (nom d'utilisateur, mot de passe sous forme hachée)</li><li>Données de rôle saisies (p. ex. activités, exigences)</li><li>Données personnelles saisies (p. ex. évaluations des styles de travail)</li><li>Résultats d'analyse générés par le système</li><li>Données d'accès techniques (adresse IP, type de navigateur, heure d'accès)</li></ul>
                <p style={pStyle}>Les données et résultats d'analyse ne sont pas stockés de manière permanente sur une base personnelle, à moins que l'utilisateur ne les enregistre explicitement.</p>
                <h2 style={h2Style}>4. Pas de stockage permanent des données d'analyse</h2>
                <p style={pStyle}>Les données et résultats d'analyse sont généralement traités de manière temporaire (basé sur la session) sans stockage permanent de données personnelles. Le prestataire n'identifie pas les personnes individuelles sur la base des données d'analyse.</p>
                <h2 style={h2Style}>5. Chiffrement SSL/TLS</h2>
                <p style={pStyle}>Pour des raisons de sécurité et pour protéger la transmission de contenus confidentiels, cette application utilise le chiffrement SSL ou TLS. Vous pouvez reconnaître une connexion chiffrée par le fait que la barre d'adresse du navigateur passe de « http:// » à « https:// » et par le symbole de cadenas dans votre barre de navigateur.</p>
                <h2 style={h2Style}>6. Fichiers journaux du serveur</h2>
                <p style={pSmStyle}>Le prestataire d'hébergement collecte et stocke automatiquement des informations dans des fichiers journaux du serveur, que votre navigateur transmet automatiquement. Il s'agit de :</p>
                <ul style={ulStyle}><li>Type et version du navigateur</li><li>Système d'exploitation utilisé</li><li>URL de référence</li><li>Nom d'hôte de l'ordinateur accédant au site</li><li>Heure de la demande au serveur</li><li>Adresse IP</li></ul>
                <p style={pStyle}>Ces données ne sont pas fusionnées avec d'autres sources de données. La base du traitement est l'Art. 6 par. 1 lit. f RGPD (intérêt légitime à une présentation et une optimisation techniquement sans erreur).</p>
                <h2 style={h2Style}>7. Utilisation du logiciel (SaaS)</h2>
                <p style={pStyle}>L'application est conçue comme un logiciel en tant que service (SaaS) et est utilisée de manière indépendante par les clients. La responsabilité de la saisie des données personnelles incombe à l'utilisateur respectif ou à l'entreprise utilisant le logiciel. Dans la mesure où le client utilise le logiciel pour traiter des données personnelles de tiers (p. ex. employés, candidats), le client est lui-même responsable du traitement au regard du droit de la protection des données.</p>
                <h2 style={h2Style}>8. Utilisation de l'intelligence artificielle</h2>
                <p style={pSmStyle}>Des services de fournisseurs d'IA externes sont utilisés pour générer des évaluations, des recommandations et des réponses de coaching assistées par IA. L'application utilise deux fournisseurs avec des domaines de responsabilité clairement séparés :</p>
                <ul style={ulStyle}><li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong> – pour générer des analyses de rôles (Rollen-DNA), des rapports de comparaison (MatchCheck), des évaluations de dynamique d'équipe, des analyses de compétences, des profils de candidats et des images générées par IA.</li><li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong> – pour le coach IA « Louis », qui mène des conversations de coaching sur le leadership, le recrutement, la dynamique d'équipe et la communication.</li></ul>
                <p style={pSmStyle}>Pour les deux fournisseurs, ce qui suit s'applique :</p>
                <ul style={ulStyle}><li>Aucun profilage indépendant n'est effectué par le fournisseur respectif</li><li>Le traitement sert exclusivement à créer des suggestions de texte, des analyses et des réponses de coaching</li><li>Aucune décision automatisée au sens de l'Art. 22 RGPD n'est prise</li><li>Les données transmises ne sont pas utilisées pour entraîner des modèles d'IA conformément aux conditions d'utilisation des fournisseurs respectifs (utilisation de l'API)</li></ul>
                <p style={pStyle}>L'utilisation des deux API peut entraîner un transfert de données vers les États-Unis (voir section « Transfert de données vers des pays tiers »).</p>
                <h2 style={h2Style}>9. Transfert de données vers des pays tiers</h2>
                <p style={pStyle}>L'utilisation d'OpenAI, d'Anthropic et, le cas échéant, du prestataire d'hébergement peut entraîner un transfert de données personnelles vers les États-Unis ou d'autres pays tiers. Le transfert est effectué sur la base de l'Art. 49 par. 1 lit. a RGPD (consentement par l'utilisation) ou de l'Art. 49 par. 1 lit. b RGPD (exécution du contrat) et, lorsqu'ils sont disponibles, sur la base du cadre de protection des données UE-États-Unis ou de garanties comparables (p. ex. clauses contractuelles types conformément à l'Art. 46 par. 2 lit. c RGPD).</p>
                <h2 style={h2Style}>10. Hébergement</h2>
                <p style={pStyle}>Le logiciel est exploité via des prestataires d'hébergement externes (p. ex. Render, San Francisco, USA, ou des prestataires comparables). Ceux-ci traitent les données exclusivement dans le cadre de la fourniture technique de l'application et agissent en tant que sous-traitants au sens de l'Art. 28 RGPD.</p>
                <h2 style={h2Style}>11. Bases juridiques</h2>
                <p style={pSmStyle}>Le traitement des données personnelles est effectué sur les bases juridiques suivantes :</p>
                <ul style={ulBotStyle}><li>Art. 6 par. 1 lit. a RGPD (consentement – lorsqu'il est donné)</li><li>Art. 6 par. 1 lit. b RGPD (exécution du contrat / utilisation du logiciel)</li><li>Art. 6 par. 1 lit. f RGPD (intérêt légitime à la fourniture stable et à l'amélioration de l'application)</li></ul>
                <h2 style={h2Style}>12. Divulgation des données</h2>
                <p style={pSmStyle}>Les données personnelles ne sont divulguées qu'à :</p>
                <ul style={ulStyle}><li>des prestataires de services techniquement nécessaires (hébergement, traitement IA)</li><li>dans la mesure requise par la loi ou nécessaire pour faire valoir des droits légaux</li></ul>
                <p style={pStyle}>Aucune divulgation supplémentaire à des tiers, notamment à des fins publicitaires ou de marketing, n'a lieu.</p>
                <h2 style={h2Style}>13. Cookies et stockage local</h2>
                <p style={pSmStyle}>L'application n'utilise que des cookies et du stockage local (localStorage) techniquement nécessaires pour gérer les sessions et permettre l'utilisation de l'application. Aucun cookie à des fins de suivi, d'analyse ou de marketing n'est utilisé. Le consentement n'est pas requis pour les cookies techniquement nécessaires conformément au § 25 par. 2 TDDDG.</p>
                <p style={pSmStyle}>Les données suivantes sont stockées dans le stockage local :</p>
                <ul style={ulBotStyle}><li>Paramètres utilisateur (p. ex. sélection de région) – de manière permanente jusqu'à modification manuelle</li><li>États intermédiaires des flux de travail en cours (p. ex. analyse de rôle, JobCheck, TeamCheck) – temporaires, supprimés lors de la réinitialisation ou de la fin du processus respectif</li><li>Résultats IA mis en cache (p. ex. textes générés) – temporaires, uniquement pour la session en cours</li></ul>
                <h2 style={h2Style}>14. Durées de conservation</h2>
                <p style={pStyle}>Les données personnelles ne sont conservées que le temps nécessaire à la finalité de traitement respective ou tel que requis par les obligations légales de conservation. Les comptes d'utilisateurs peuvent être supprimés à tout moment sur demande. Les données et résultats d'analyse ne sont généralement pas stockés de manière permanente.</p>
                <h2 style={h2Style}>15. Droits des personnes concernées</h2>
                <p style={pSmStyle}>Vous disposez des droits suivants en vertu du RGPD :</p>
                <ul style={ulStyle}><li>Droit d'accès (Art. 15 RGPD)</li><li>Droit de rectification (Art. 16 RGPD)</li><li>Droit à l'effacement (Art. 17 RGPD)</li><li>Droit à la limitation du traitement (Art. 18 RGPD)</li><li>Droit à la portabilité des données (Art. 20 RGPD)</li><li>Droit d'opposition (Art. 21 RGPD)</li><li>Droit de retirer son consentement (Art. 7 par. 3 RGPD)</li></ul>
                <p style={pStyle}>Pour exercer ces droits, veuillez contacter : info@foresmind.de</p>
                <h2 style={h2Style}>16. Droit d'introduire une réclamation auprès d'une autorité de contrôle</h2>
                <p style={pStyle}>Sans préjudice de tout autre recours administratif ou judiciaire, vous avez le droit d'introduire une réclamation auprès d'une autorité de contrôle si vous estimez que le traitement de vos données personnelles enfreint le RGPD. L'autorité de contrôle compétente est :<br /><br />Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />Promenade 18<br />91522 Ansbach<br /><a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.lda.bayern.de</a></p>
                <h2 style={h2Style}>17. Note de classification</h2>
                <p style={pStyle}>Les analyses fournies décrivent des modèles récurrents dans un contexte de travail, doivent être comprises de manière neutre et ne représentent pas des profils de personnalité fixes. Elles ne remplacent pas les évaluations ou décisions individuelles mais servent exclusivement d'orientation.</p>
                <h2 style={h2Style}>18. Modifications de cette politique de confidentialité</h2>
                <p style={pStyle}>Nous nous réservons le droit d'adapter cette politique de confidentialité pour la maintenir en conformité avec les exigences légales actuelles ou pour refléter les modifications de nos services. La politique de confidentialité en vigueur s'appliquera lors de votre prochaine visite.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>Mise à jour : avril 2026 · © {new Date().getFullYear()} foresMind® GmbH. Tous droits réservés.</p>
              </div>
            </>
          ) : it ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">Informativa sulla privacy</h1>
              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>
                <h2 style={h2Style}>1. Titolare del trattamento</h2>
                <p style={pStyle}>Il titolare del trattamento dei dati ai sensi del Regolamento generale sulla protezione dei dati (RGPD) è:<br /><br />foresMind® GmbH<br />Sonnenhang 4<br />87674 Ruderatshofen<br />Germania<br />E-mail: info@foresmind.de<br />Telefono: +49 (0)8343 / 338 998 – 1</p>
                <h2 style={h2Style}>2. Informazioni generali</h2>
                <p style={pStyle}>Questo software viene utilizzato per analizzare stili di lavoro, requisiti di ruolo e costellazioni di team. Le valutazioni non costituiscono decisioni automatizzate ai sensi dell'Art. 22 RGPD e non hanno effetti giuridici sulle persone interessate. I risultati servono esclusivamente come base di supporto alle decisioni. Non viene effettuata alcuna profilazione ai sensi del RGPD.</p>
                <h2 style={h2Style}>3. Tipi di dati trattati</h2>
                <p style={pSmStyle}>Nel corso dell'utilizzo possono essere trattati i seguenti dati:</p>
                <ul style={ulStyle}><li>Dati di accesso (nome utente, password in forma hash)</li><li>Dati di ruolo inseriti (p. es. attività, requisiti)</li><li>Dati personali inseriti (p. es. valutazioni degli stili di lavoro)</li><li>Risultati di analisi generati dal sistema</li><li>Dati di accesso tecnici (indirizzo IP, tipo di browser, ora di accesso)</li></ul>
                <p style={pStyle}>I dati e i risultati dell'analisi non vengono memorizzati in modo permanente su base personale, a meno che l'utente non li salvi esplicitamente.</p>
                <h2 style={h2Style}>4. Nessuna memorizzazione permanente dei dati di analisi</h2>
                <p style={pStyle}>I dati e i risultati dell'analisi vengono generalmente elaborati in modo temporaneo (basato sulla sessione) senza memorizzazione permanente di dati personali. Il fornitore non identifica singole persone sulla base dei dati di analisi.</p>
                <h2 style={h2Style}>5. Crittografia SSL/TLS</h2>
                <p style={pStyle}>Per motivi di sicurezza e per proteggere la trasmissione di contenuti riservati, questa applicazione utilizza la crittografia SSL o TLS. È possibile riconoscere una connessione crittografata dal fatto che la barra degli indirizzi del browser passa da "http://" a "https://" e dal simbolo del lucchetto nella barra del browser.</p>
                <h2 style={h2Style}>6. File di registro del server</h2>
                <p style={pSmStyle}>Il provider di hosting raccoglie e memorizza automaticamente informazioni nei cosiddetti file di registro del server, che il browser trasmette automaticamente. Questi sono:</p>
                <ul style={ulStyle}><li>Tipo e versione del browser</li><li>Sistema operativo utilizzato</li><li>URL di riferimento</li><li>Nome host del computer che accede</li><li>Ora della richiesta al server</li><li>Indirizzo IP</li></ul>
                <p style={pStyle}>Questi dati non vengono uniti ad altre fonti di dati. La base del trattamento è l'Art. 6 par. 1 lit. f RGPD (interesse legittimo a una presentazione tecnicamente priva di errori e all'ottimizzazione).</p>
                <h2 style={h2Style}>7. Utilizzo del software (SaaS)</h2>
                <p style={pStyle}>L'applicazione è concepita come Software-as-a-Service (SaaS) e viene utilizzata in modo indipendente dai clienti. La responsabilità dell'inserimento dei dati personali spetta al rispettivo utente o all'azienda che utilizza il software. Nella misura in cui il cliente utilizza il software per trattare dati personali di terzi (p. es. dipendenti, candidati), il cliente è esso stesso il titolare del trattamento responsabile ai sensi del diritto sulla protezione dei dati.</p>
                <h2 style={h2Style}>8. Utilizzo dell'intelligenza artificiale</h2>
                <p style={pSmStyle}>Per generare valutazioni, raccomandazioni e risposte di coaching assistite dall'IA vengono utilizzati servizi di provider di IA esterni. L'applicazione utilizza due provider con aree di responsabilità chiaramente separate:</p>
                <ul style={ulStyle}><li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong> – per generare analisi di ruolo (Rollen-DNA), report di confronto (MatchCheck), valutazioni della dinamica del team, analisi delle competenze, profili dei candidati e immagini generate dall'IA.</li><li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong> – per il coach IA «Louis», che conduce conversazioni di coaching su leadership, recruiting, dinamica del team e comunicazione.</li></ul>
                <p style={pSmStyle}>Per entrambi i provider vale quanto segue:</p>
                <ul style={ulStyle}><li>Nessuna profilazione indipendente viene effettuata dal rispettivo provider</li><li>Il trattamento serve esclusivamente a creare suggerimenti di testo, analisi e risposte di coaching</li><li>Non vengono prese decisioni automatizzate ai sensi dell'Art. 22 RGPD</li><li>I dati trasmessi non vengono utilizzati per addestrare modelli di IA in conformità con le condizioni d'uso dei rispettivi provider (utilizzo dell'API)</li></ul>
                <p style={pStyle}>L'utilizzo di entrambe le API può comportare un trasferimento di dati negli Stati Uniti (vedere sezione «Trasferimento di dati verso paesi terzi»).</p>
                <h2 style={h2Style}>9. Trasferimento di dati verso paesi terzi</h2>
                <p style={pStyle}>L'utilizzo di OpenAI, Anthropic e, se del caso, del provider di hosting può comportare un trasferimento di dati personali negli Stati Uniti o in altri paesi terzi. Il trasferimento avviene sulla base dell'Art. 49 par. 1 lit. a RGPD (consenso tramite utilizzo) o dell'Art. 49 par. 1 lit. b RGPD (esecuzione del contratto) e, ove disponibili, sulla base del Quadro per la privacy dei dati UE-USA o di garanzie comparabili (p. es. clausole contrattuali standard ai sensi dell'Art. 46 par. 2 lit. c RGPD).</p>
                <h2 style={h2Style}>10. Hosting</h2>
                <p style={pStyle}>Il software è gestito tramite provider di hosting esterni (p. es. Render, San Francisco, USA, o provider comparabili). Questi trattano i dati esclusivamente nell'ambito della fornitura tecnica dell'applicazione e agiscono come responsabili del trattamento ai sensi dell'Art. 28 RGPD.</p>
                <h2 style={h2Style}>11. Basi giuridiche</h2>
                <p style={pSmStyle}>Il trattamento dei dati personali viene effettuato sulle seguenti basi giuridiche:</p>
                <ul style={ulBotStyle}><li>Art. 6 par. 1 lit. a RGPD (consenso – ove prestato)</li><li>Art. 6 par. 1 lit. b RGPD (esecuzione del contratto / utilizzo del software)</li><li>Art. 6 par. 1 lit. f RGPD (interesse legittimo alla fornitura stabile e al miglioramento dell'applicazione)</li></ul>
                <h2 style={h2Style}>12. Divulgazione dei dati</h2>
                <p style={pSmStyle}>I dati personali vengono divulgati esclusivamente:</p>
                <ul style={ulStyle}><li>a fornitori di servizi tecnicamente necessari (hosting, elaborazione IA)</li><li>nella misura richiesta dalla legge o necessaria per far valere diritti legali</li></ul>
                <p style={pStyle}>Non avviene alcuna divulgazione ulteriore a terzi, in particolare a fini pubblicitari o di marketing.</p>
                <h2 style={h2Style}>13. Cookie e archiviazione locale</h2>
                <p style={pSmStyle}>L'applicazione utilizza solo cookie e archiviazione locale (localStorage) tecnicamente necessari per gestire le sessioni e consentire l'utilizzo dell'applicazione. Non vengono utilizzati cookie a fini di tracciamento, analisi o marketing. Il consenso non è richiesto per i cookie tecnicamente necessari ai sensi del § 25 par. 2 TDDDG.</p>
                <p style={pSmStyle}>I seguenti dati vengono memorizzati nell'archiviazione locale:</p>
                <ul style={ulBotStyle}><li>Impostazioni utente (p. es. selezione della regione) – in modo permanente fino alla modifica manuale</li><li>Stati intermedi dei flussi di lavoro in corso (p. es. analisi di ruolo, JobCheck, TeamCheck) – temporanei, eliminati al ripristino o al completamento del rispettivo processo</li><li>Risultati IA memorizzati nella cache (p. es. testi generati) – temporanei, solo per la sessione corrente</li></ul>
                <h2 style={h2Style}>14. Periodi di conservazione</h2>
                <p style={pStyle}>I dati personali vengono conservati solo per il tempo necessario alla rispettiva finalità di trattamento o come richiesto dagli obblighi legali di conservazione. Gli account utente possono essere eliminati in qualsiasi momento su richiesta. I dati e i risultati dell'analisi non vengono generalmente memorizzati in modo permanente.</p>
                <h2 style={h2Style}>15. Diritti degli interessati</h2>
                <p style={pSmStyle}>Ai sensi del RGPD, lei dispone dei seguenti diritti:</p>
                <ul style={ulStyle}><li>Diritto di accesso (Art. 15 RGPD)</li><li>Diritto di rettifica (Art. 16 RGPD)</li><li>Diritto alla cancellazione (Art. 17 RGPD)</li><li>Diritto alla limitazione del trattamento (Art. 18 RGPD)</li><li>Diritto alla portabilità dei dati (Art. 20 RGPD)</li><li>Diritto di opposizione (Art. 21 RGPD)</li><li>Diritto di revocare il consenso (Art. 7 par. 3 RGPD)</li></ul>
                <p style={pStyle}>Per esercitare questi diritti, contattare: info@foresmind.de</p>
                <h2 style={h2Style}>16. Diritto di proporre reclamo a un'autorità di controllo</h2>
                <p style={pStyle}>Fatte salve altre vie di ricorso amministrativo o giudiziario, lei ha il diritto di proporre reclamo a un'autorità di controllo se ritiene che il trattamento dei suoi dati personali violi il RGPD. L'autorità di controllo competente è:<br /><br />Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />Promenade 18<br />91522 Ansbach<br /><a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.lda.bayern.de</a></p>
                <h2 style={h2Style}>17. Nota classificatoria</h2>
                <p style={pStyle}>Le analisi fornite descrivono modelli ricorrenti in un contesto lavorativo, devono essere intese in modo neutro rispetto ai valori e non rappresentano profili di personalità fissi. Non sostituiscono valutazioni o decisioni individuali ma servono esclusivamente come orientamento.</p>
                <h2 style={h2Style}>18. Modifiche a questa informativa sulla privacy</h2>
                <p style={pStyle}>Ci riserviamo il diritto di adattare questa informativa sulla privacy per mantenerla in linea con i requisiti legali attuali o per riflettere le modifiche ai nostri servizi. L'informativa sulla privacy in vigore si applicherà alla visita successiva.</p>
                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>Aggiornato: aprile 2026 · © {new Date().getFullYear()} foresMind® GmbH. Tutti i diritti riservati.</p>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 24px", textAlign: "center" }} data-testid="text-datenschutz-title">{t("Datenschutzerklärung")}</h1>

              <div style={{ fontSize: 15, color: "#1D1D1F", lineHeight: 1.8 }}>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>1. Verantwortlicher</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:")}<br /><br />
                  foresMind® GmbH<br />
                  Sonnenhang 4<br />
                  87674 Ruderatshofen<br />
                  Deutschland<br />
                  E-Mail: info@foresmind.de<br />
                  Telefon: +49 (0)8343 / 338 998 – 1
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>2. Allgemeine Hinweise</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Diese Software dient der Analyse von Arbeitsweisen, Rollenanforderungen und Teamkonstellationen. Die Auswertungen stellen keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO dar und entfalten keine rechtliche Wirkung gegenüber betroffenen Personen. Die Ergebnisse dienen ausschliesslich als unterstützende Entscheidungsgrundlage. Es findet kein Profiling im Sinne der DSGVO statt.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>3. Art der verarbeiteten Daten</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Im Rahmen der Nutzung können folgende Daten verarbeitet werden:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("Anmeldedaten (Benutzername, Passwort in gehashter Form)")}</li>
                  <li>{t("Eingaben zur Rolle (z.\u00A0B. Tätigkeiten, Anforderungen)")}</li>
                  <li>{t("Eingaben zur Person (z.\u00A0B. Einschätzungen von Arbeitsweisen)")}</li>
                  <li>{t("Systemgenerierte Analyse-Ergebnisse")}</li>
                  <li>{t("Technische Zugriffsdaten (IP-Adresse, Browsertyp, Zugriffszeitpunkt)")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Analyse-Eingaben und -Ergebnisse werden nicht dauerhaft personenbezogen gespeichert, sofern keine explizite Speicherung durch den Nutzer erfolgt.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>4. Keine dauerhafte Speicherung von Analysedaten</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Verarbeitung von Analyse-Eingaben und -Ergebnissen erfolgt in der Regel temporär (Session-basiert) ohne dauerhafte Speicherung personenbezogener Daten. Eine Identifizierung einzelner Personen anhand der Analysedaten durch den Anbieter erfolgt nicht.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("5. SSL-/TLS-Verschlüsselung")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Diese Anwendung nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von «http://» auf «https://» wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>6. Server-Logfiles</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Der Hosting-Provider erhebt und speichert automatisch Informationen in sogenannten Server-Logfiles, die Ihr Browser automatisch übermittelt. Dies sind:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>Browsertyp und Browserversion</li>
                  <li>Verwendetes Betriebssystem</li>
                  <li>Referrer URL</li>
                  <li>Hostname des zugreifenden Rechners</li>
                  <li>Uhrzeit der Serveranfrage</li>
                  <li>IP-Adresse</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technisch fehlerfreien Darstellung und Optimierung).")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>7. Nutzung der Software (SaaS)</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Anwendung ist als Software-as-a-Service (SaaS) konzipiert und wird von Kunden eigenständig genutzt. Die Verantwortung für die Eingabe personenbezogener Daten liegt beim jeweiligen Nutzer bzw. dem Unternehmen, das die Software einsetzt. Soweit der Kunde die Software zur Verarbeitung personenbezogener Daten Dritter (z.\u00A0B. Mitarbeiter, Bewerber) verwendet, ist der Kunde selbst datenschutzrechtlich Verantwortlicher für diese Verarbeitung.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("8. Einsatz von Künstlicher Intelligenz")}</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Zur Generierung von Auswertungen, Empfehlungen und KI-gestützten Coaching-Antworten werden Dienste externer KI-Anbieter eingesetzt. Die Anwendung nutzt dabei zwei Anbieter mit klar getrennten Aufgabenbereichen:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li><strong>OpenAI (OpenAI, L.L.C., San Francisco, USA)</strong>{t(" – für die Generierung von Rollenanalysen (Rollen-DNA), Vergleichsberichten (MatchCheck), Teamdynamik-Auswertungen, Kompetenzanalysen, Kandidatenprofilen sowie KI-generierten Bildern.")}</li>
                  <li><strong>Anthropic (Anthropic, PBC, San Francisco, USA)</strong>{t(" – für den KI-Coach «Louis», der Coaching-Gespräche zu Führung, Recruiting, Teamdynamik und Kommunikation führt.")}</li>
                </ul>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Für beide Anbieter gilt:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("Es erfolgt keine eigenständige Profilbildung durch den jeweiligen Anbieter")}</li>
                  <li>{t("Die Verarbeitung dient ausschliesslich der Erstellung von Textvorschlägen, Analysen und Coaching-Antworten")}</li>
                  <li>{t("Es werden keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO getroffen")}</li>
                  <li>{t("Die übermittelten Daten werden gemäss den jeweiligen Nutzungsbedingungen der Anbieter nicht zum Training von KI-Modellen verwendet (API-Nutzung)")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Durch die Nutzung beider APIs kann eine Datenübermittlung in die USA erfolgen (siehe Abschnitt «Datenübermittlung in Drittländer»).")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("9. Datenübermittlung in Drittländer")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Durch den Einsatz von OpenAI, Anthropic und ggf. des Hosting-Anbieters kann eine Übermittlung personenbezogener Daten in die USA oder andere Drittländer erfolgen. Die Übermittlung erfolgt auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO (Einwilligung durch Nutzung) bzw. Art. 49 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie, soweit vorhanden, auf Grundlage des EU-US Data Privacy Framework oder vergleichbarer Garantien (z.\u00A0B. Standardvertragsklauseln gemäss Art. 46 Abs. 2 lit. c DSGVO).")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>10. Hosting</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die Software wird über externe Hosting-Dienstleister betrieben (z.\u00A0B. Render, San Francisco, USA, oder vergleichbare Anbieter). Diese verarbeiten Daten ausschliesslich im Rahmen der technischen Bereitstellung der Anwendung und handeln als Auftragsverarbeiter im Sinne von Art. 28 DSGVO.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>11. Rechtsgrundlagen</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Die Verarbeitung personenbezogener Daten erfolgt auf folgenden Rechtsgrundlagen:")}
                </p>
                <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
                  <li>{t("Art. 6 Abs. 1 lit. a DSGVO (Einwilligung – soweit erteilt)")}</li>
                  <li>{t("Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung / Nutzung der Software)")}</li>
                  <li>{t("Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an stabiler Bereitstellung und Verbesserung der Anwendung)")}</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>12. Weitergabe von Daten</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Eine Weitergabe personenbezogener Daten erfolgt ausschliesslich:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("an technisch notwendige Dienstleister (Hosting, KI-Verarbeitung)")}</li>
                  <li>{t("soweit gesetzlich vorgeschrieben oder zur Rechtsdurchsetzung erforderlich")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Eine darüber hinausgehende Weitergabe an Dritte, insbesondere zu Werbe- oder Marketingzwecken, erfolgt nicht.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>13. Cookies und lokaler Speicher</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Die Anwendung verwendet ausschliesslich technisch notwendige Cookies und lokalen Speicher (localStorage), um Sitzungen zu verwalten und die Nutzung der Anwendung zu ermöglichen. Es werden keine Cookies zu Tracking-, Analyse- oder Marketingzwecken eingesetzt. Eine Einwilligung ist für technisch notwendige Cookies gemäss § 25 Abs. 2 TDDDG nicht erforderlich.")}
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Im lokalen Speicher werden folgende Daten abgelegt:")}
                </p>
                <ul style={{ margin: "0 0 20px", paddingLeft: 20 }}>
                  <li>{t("Benutzereinstellungen (z.\u00A0B. Regionauswahl) – dauerhaft bis zur manuellen Änderung")}</li>
                  <li>{t("Zwischenstände laufender Arbeitsabläufe (z.\u00A0B. Rollenanalyse, JobCheck, TeamCheck) – temporär, werden beim Zurücksetzen oder Abschluss des jeweiligen Vorgangs gelöscht")}</li>
                  <li>{t("Zwischengespeicherte KI-Ergebnisse (z.\u00A0B. generierte Texte) – temporär, nur für die aktuelle Sitzung")}</li>
                </ul>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>14. Aufbewahrungsfristen</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Benutzerkonten können auf Anfrage jederzeit gelöscht werden. Analyse-Eingaben und -Ergebnisse werden in der Regel nicht dauerhaft gespeichert.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("15. Rechte der betroffenen Personen")}</h2>
                <p style={{ margin: "0 0 8px" }}>
                  {t("Sie haben gemäss DSGVO folgende Rechte:")}
                </p>
                <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
                  <li>{t("Recht auf Auskunft (Art. 15 DSGVO)")}</li>
                  <li>{t("Recht auf Berichtigung (Art. 16 DSGVO)")}</li>
                  <li>{t("Recht auf Löschung (Art. 17 DSGVO)")}</li>
                  <li>{t("Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)")}</li>
                  <li>{t("Recht auf Datenübertragbarkeit (Art. 20 DSGVO)")}</li>
                  <li>{t("Widerspruchsrecht (Art. 21 DSGVO)")}</li>
                  <li>{t("Recht auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)")}</li>
                </ul>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Zur Ausübung dieser Rechte wenden Sie sich bitte an: info@foresmind.de")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("16. Beschwerderecht bei der Aufsichtsbehörde")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstösst. Die zuständige Aufsichtsbehörde ist:")}<br /><br />
                  {t("Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)")}<br />
                  Promenade 18<br />
                  91522 Ansbach<br />
                  <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>www.lda.bayern.de</a>
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>17. Einordnungshinweis</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Die bereitgestellten Analysen beschreiben wiederkehrende Muster im Arbeitskontext, sind wertfrei zu verstehen und stellen keine festen Persönlichkeitsprofile dar. Sie ersetzen keine individuelle Bewertung oder Entscheidung, sondern dienen ausschliesslich als Orientierung.")}
                </p>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{t("18. Änderung dieser Datenschutzerklärung")}</h2>
                <p style={{ margin: "0 0 20px" }}>
                  {t("Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt dann die jeweils aktuelle Datenschutzerklärung.")}
                </p>

                <p style={{ margin: 0, fontSize: 13, color: "#8E8E93" }}>
                  {t("Stand: April 2026 · © ")} {new Date().getFullYear()} foresMind® GmbH. Alle Rechte vorbehalten.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
