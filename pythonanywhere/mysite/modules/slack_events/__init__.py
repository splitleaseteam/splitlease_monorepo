"""
Slack Events Module
Universal endpoint for receiving and processing Slack event subscriptions
"""

from .routes import slack_events

__all__ = ['slack_events']
