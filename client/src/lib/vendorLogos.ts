/**
 * Vendor Logo Mapping
 * Maps technology names to their official logo URLs from CDN sources
 */

export const vendorLogos: Record<string, { url: string; alt: string }> = {
  // Cloud Platforms
  AWS: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original.svg",
    alt: "AWS Logo",
  },
  "Microsoft Azure": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Microsoft Azure Logo",
  },
  "Google Cloud": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    alt: "Google Cloud Logo",
  },

  // Infrastructure & Orchestration
  Kubernetes: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg",
    alt: "Kubernetes Logo",
  },
  Docker: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
    alt: "Docker Logo",
  },
  Terraform: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/terraform/terraform-original.svg",
    alt: "Terraform Logo",
  },
  CloudFormation: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original.svg",
    alt: "CloudFormation Logo",
  },
  Ansible: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ansible/ansible-original.svg",
    alt: "Ansible Logo",
  },

  // Monitoring & Observability
  Prometheus: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prometheus/prometheus-original.svg",
    alt: "Prometheus Logo",
  },
  Grafana: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/grafana/grafana-original.svg",
    alt: "Grafana Logo",
  },

  // AI & ML
  TensorFlow: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
    alt: "TensorFlow Logo",
  },
  PyTorch: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg",
    alt: "PyTorch Logo",
  },
  OpenAI: {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    alt: "OpenAI Logo",
  },
  "Azure AI": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Azure AI Logo",
  },
  "AWS SageMaker": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original.svg",
    alt: "AWS SageMaker Logo",
  },
  "Hugging Face": {
    url: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    alt: "Hugging Face Logo",
  },
  LangChain: {
    url: "https://avatars.githubusercontent.com/u/126733545?s=200&v=4",
    alt: "LangChain Logo",
  },
  MLflow: {
    url: "https://mlflow.org/docs/latest/_static/MLflow-logo-final-white-TM.png",
    alt: "MLflow Logo",
  },

  // Programming Languages
  Python: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
    alt: "Python Logo",
  },

  // Security
  CrowdStrike: {
    url: "https://www.crowdstrike.com/favicon.ico",
    alt: "CrowdStrike Logo",
  },
  "Palo Alto": {
    url: "https://www.paloaltonetworks.com/favicon.ico",
    alt: "Palo Alto Networks Logo",
  },
  Splunk: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/splunk/splunk-original.svg",
    alt: "Splunk Logo",
  },
  "Microsoft Sentinel": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Microsoft Sentinel Logo",
  },
  "AWS Security Hub": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original.svg",
    alt: "AWS Security Hub Logo",
  },
  Okta: {
    url: "https://www.okta.com/favicon.ico",
    alt: "Okta Logo",
  },
  "HashiCorp Vault": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vault/vault-original.svg",
    alt: "HashiCorp Vault Logo",
  },
  Snyk: {
    url: "https://res.cloudinary.com/snyk/image/upload/v1537345894/press-kit/brand/logo-black.png",
    alt: "Snyk Logo",
  },
  Tenable: {
    url: "https://www.tenable.com/favicon.ico",
    alt: "Tenable Logo",
  },
  KnowBe4: {
    url: "https://www.knowbe4.com/favicon.ico",
    alt: "KnowBe4 Logo",
  },

  // Data & Analytics
  Snowflake: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/snowflake/snowflake-original.svg",
    alt: "Snowflake Logo",
  },
  BigQuery: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
    alt: "BigQuery Logo",
  },
  Redshift: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original.svg",
    alt: "Redshift Logo",
  },
  Tableau: {
    url: "https://www.tableau.com/favicon.ico",
    alt: "Tableau Logo",
  },
  "Power BI": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/powerbi/powerbi-original.svg",
    alt: "Power BI Logo",
  },
  "Apache Spark": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apachespark/apachespark-original.svg",
    alt: "Apache Spark Logo",
  },
  dbt: {
    url: "https://www.getdbt.com/ui/img/favicon.png",
    alt: "dbt Logo",
  },
  Airflow: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apacheairflow/apacheairflow-original.svg",
    alt: "Apache Airflow Logo",
  },
  Kafka: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apachekafka/apachekafka-original.svg",
    alt: "Apache Kafka Logo",
  },
  Looker: {
    url: "https://www.looker.com/favicon.ico",
    alt: "Looker Logo",
  },

  // Microsoft 365
  "Microsoft 365": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftoffice/microsoftoffice-original.svg",
    alt: "Microsoft 365 Logo",
  },
  "Azure AD": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Azure AD Logo",
  },
  Intune: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Intune Logo",
  },
  ConnectWise: {
    url: "https://www.connectwise.com/favicon.ico",
    alt: "ConnectWise Logo",
  },
  Datto: {
    url: "https://www.datto.com/favicon.ico",
    alt: "Datto Logo",
  },
  SentinelOne: {
    url: "https://www.sentinelone.com/favicon.ico",
    alt: "SentinelOne Logo",
  },
  "Cisco Meraki": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cisco/cisco-original.svg",
    alt: "Cisco Meraki Logo",
  },
  Fortinet: {
    url: "https://www.fortinet.com/favicon.ico",
    alt: "Fortinet Logo",
  },
  VMware: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vmware/vmware-original.svg",
    alt: "VMware Logo",
  },
  Veeam: {
    url: "https://www.veeam.com/favicon.ico",
    alt: "Veeam Logo",
  },
  "Exchange Online": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftoffice/microsoftoffice-original.svg",
    alt: "Exchange Online Logo",
  },
  "Microsoft Teams": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftteams/microsoftteams-original.svg",
    alt: "Microsoft Teams Logo",
  },
  SharePoint: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftoffice/microsoftoffice-original.svg",
    alt: "SharePoint Logo",
  },
  OneDrive: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftoffice/microsoftoffice-original.svg",
    alt: "OneDrive Logo",
  },
  "Defender for Office 365": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Defender for Office 365 Logo",
  },
  "Power Automate": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/powerbi/powerbi-original.svg",
    alt: "Power Automate Logo",
  },
  Sherweb: {
    url: "https://www.sherweb.com/favicon.ico",
    alt: "Sherweb Logo",
  },
  "SharePoint Online": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftoffice/microsoftoffice-original.svg",
    alt: "SharePoint Online Logo",
  },
  "Entra ID": {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
    alt: "Entra ID Logo",
  },

  // Strategy & Framework
  TOGAF: {
    url: "https://www.opengroup.org/sites/default/files/styles/og_image/public/images/togaf_logo_0.png",
    alt: "TOGAF Logo",
  },
  ITIL: {
    url: "https://www.axelos.com/favicon.ico",
    alt: "ITIL Logo",
  },
  Agile: {
    url: "https://www.agilealliance.org/favicon.ico",
    alt: "Agile Logo",
  },
  SAFe: {
    url: "https://www.scaledagileframework.com/favicon.ico",
    alt: "SAFe Logo",
  },
  COBIT: {
    url: "https://www.isaca.org/favicon.ico",
    alt: "COBIT Logo",
  },

  // Fallback for unknown vendors
  default: {
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/devicon/devicon-original.svg",
    alt: "Technology Logo",
  },
};

/**
 * Get logo URL for a vendor
 * Falls back to placeholder if not found
 */
export function getVendorLogo(vendorName: string): { url: string; alt: string } {
  return vendorLogos[vendorName] || vendorLogos.default;
}
