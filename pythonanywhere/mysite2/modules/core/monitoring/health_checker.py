"""Health checker module for monitoring endpoint health"""
import logging
import time
import requests
import concurrent.futures
from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)

class HealthChecker:
    def __init__(self, base_url: str, error_webhook: str, success_webhook: str, config: Dict[str, Any]):
        """Initialize health checker
        
        Args:
            base_url: Base URL for all endpoints
            error_webhook: Slack webhook for error notifications
            success_webhook: Slack webhook for success notifications
            config: Health check configuration
        """
        self.base_url = base_url.rstrip('/')
        self.error_webhook = error_webhook
        self.success_webhook = success_webhook
        self.config = config
        
        # Default headers
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def check_endpoint(self, endpoint: str, test_config: Dict[str, Any]) -> Dict[str, Any]:
        """Check a single endpoint
        
        Args:
            endpoint: Endpoint path
            test_config: Test configuration for the endpoint
            
        Returns:
            Dict containing test results
        """
        url = f"{self.base_url}{endpoint}"
        method = test_config['method']
        data = test_config.get('data')
        expected_status = test_config['expected_status']
        
        start_time = time.time()
        retries = 0
        last_error = None
        
        while retries < self.config['max_retries']:
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    json=data,
                    headers=self.headers,
                    timeout=self.config['timeout']
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code in expected_status:
                    return {
                        'endpoint': endpoint,
                        'status': 'HEALTHY',
                        'response_time': elapsed,
                        'service_group': test_config['service_group']
                    }
                
                last_error = f"Unexpected status code: {response.status_code}"
                
            except Exception as e:
                last_error = str(e)
                
            retries += 1
            if retries < self.config['max_retries']:
                time.sleep(self.config['retry_delay'])
        
        elapsed = time.time() - start_time
        return {
            'endpoint': endpoint,
            'status': 'UNHEALTHY',
            'response_time': elapsed,
            'error': f"Failed after {retries} attempts - {last_error}",
            'service_group': test_config['service_group']
        }

    def run_health_checks(self, tests: Dict[str, Dict[str, Any]], service_order: List[str]) -> str:
        """Run health checks for all endpoints
        
        Args:
            tests: Dictionary of test configurations
            service_order: List defining the order of services in the report
            
        Returns:
            Formatted Slack message
        """
        results = []
        
        # Run tests concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config['concurrent_checks']) as executor:
            future_to_endpoint = {
                executor.submit(self.check_endpoint, endpoint, config): endpoint
                for endpoint, config in tests.items()
            }
            
            for future in concurrent.futures.as_completed(future_to_endpoint):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    endpoint = future_to_endpoint[future]
                    results.append({
                        'endpoint': endpoint,
                        'status': 'ERROR',
                        'error': str(e),
                        'service_group': tests[endpoint]['service_group']
                    })
        
        # Calculate overall statistics
        total = len(results)
        healthy = sum(1 for r in results if r.get('status') == 'HEALTHY')
        unhealthy = total - healthy
        avg_response_time = sum(r.get('response_time', 0) for r in results) / total if total > 0 else 0
        
        # Group results by service
        service_results = defaultdict(list)
        for result in results:
            service_results[result['service_group']].append(result)
        
        # Format message
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status_emoji = ':white_check_mark:' if unhealthy == 0 else ':x: ERROR'
        
        message = [
            f"{status_emoji}: :hospital: SplitLease API Health Report - {now}",
            "",
            "Overall Health Summary",
            f"• Total Endpoints: {total}",
            f"• Healthy: {healthy}",
            f"• Unhealthy: {unhealthy} {':rotating_light:' if unhealthy > 0 else ''}",
            f"• Average Response Time: {avg_response_time:.2f}s",
            ""
        ]
        
        # Add service groups in specified order
        for service_group in service_order:
            if service_group in service_results:
                group_results = service_results[service_group]
                group_healthy = sum(1 for r in group_results if r.get('status') == 'HEALTHY')
                group_total = len(group_results)
                group_emoji = ':white_check_mark:' if group_healthy == group_total else ':rotating_light:'
                
                message.append(f"{service_group} {group_emoji}")
                message.append(f"• Success Rate: {group_healthy}/{group_total}")
                
                for result in group_results:
                    status_icon = ':white_check_mark:' if result.get('status') == 'HEALTHY' else ':x:'
                    endpoint_name = result['endpoint'].split('/')[-1].replace('_', ' ').title()
                    if result.get('status') == 'HEALTHY':
                        message.append(f"  • {status_icon} {endpoint_name}: {result.get('response_time', 0):.2f}s")
                    else:
                        message.append(f"  • {status_icon} {endpoint_name}: {result.get('error', 'Unknown error')}")
                
                message.append("")
        
        return "\n".join(message)

    def send_report(self, message: str):
        """Send report to Slack
        
        Args:
            message: Formatted message to send
        """
        webhook_url = self.success_webhook if ":rotating_light:" not in message else self.error_webhook
        
        try:
            response = requests.post(webhook_url, json={'text': message})
            response.raise_for_status()
            logger.info("Successfully sent health report to Slack")
        except Exception as e:
            logger.error(f"Failed to send health report to Slack: {str(e)}")

    def check_health(self, tests: Dict[str, Dict[str, Any]], service_order: List[str]) -> List[Dict[str, Any]]:
        """Run all health checks and send report
        
        Args:
            tests: Dictionary of test configurations
            service_order: List defining the order of services in the report
            
        Returns:
            List of test results
        """
        try:
            message = self.run_health_checks(tests, service_order)
            self.send_report(message)
            return message
        except Exception as e:
            logger.error(f"Error running health checks: {str(e)}")
            return None
