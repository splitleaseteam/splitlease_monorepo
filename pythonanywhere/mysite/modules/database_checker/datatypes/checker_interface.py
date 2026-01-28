"""
Data Checker Interface

This module defines the interface that all data type checker modules should implement.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class DataCheckerInterface(ABC):
    """
    Abstract interface for data type checkers
    
    All data type checkers must implement these methods to provide
    consistent behavior across different data types.
    """
    
    @classmethod
    @abstractmethod
    def run_all_checks(cls, entries: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Run all checks for this data type
        
        Args:
            entries: List of data entries to check
            
        Returns:
            Dictionary with counts and statistics
        """
        pass
    
    @staticmethod
    @abstractmethod
    def generate_report(check_results: Dict[str, int]) -> str:
        """
        Generate a formatted report from check results
        
        Args:
            check_results: Dictionary with check counts and statistics
            
        Returns:
            Formatted report string
        """
        pass
