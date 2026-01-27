"""
Slack Event Handler Service - UPDATED
Processes incoming Slack events and routes them based on event type, app, and channel
Routes signup messages with trigger code to signup automation module
"""

import os
import logging
import json
from typing import Dict, Any, Optional
from modules.logging.error_logger import log_error
from modules.logging.success_logger import log_success

logger = logging.getLogger(__name__)


class SlackEventHandler:
    """
    Service class for handling Slack events
    Routes events to appropriate handlers based on event type, team, app, and channel
    """

    def __init__(self):
        """Initialize the Slack Event Handler"""
        logger.info("Initializing Slack Event Handler")

    def process_event(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        full_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a Slack event and route to appropriate handler

        Args:
            event_type: The type of event (e.g., 'message', 'app_mention', 'reaction_added')
            event_data: The event data from Slack
            team_id: The Slack workspace/team ID
            api_app_id: The Slack app ID
            full_payload: The complete event payload from Slack

        Returns:
            dict: Result with status and message
        """
        logger.info(f"Processing event: type={event_type}, team={team_id}, app={api_app_id}")

        try:
            # Extract common event properties
            channel_id = event_data.get('channel', 'unknown')
            user_id = event_data.get('user', 'unknown')
            event_ts = event_data.get('event_ts', 'unknown')

            # Log event details
            logger.info(f"Event details: channel={channel_id}, user={user_id}, ts={event_ts}")

            # Route to specific handler based on event type
            if event_type == 'message':
                return self._handle_message_event(event_data, team_id, api_app_id, channel_id)

            elif event_type == 'app_mention':
                return self._handle_app_mention_event(event_data, team_id, api_app_id, channel_id)

            elif event_type == 'reaction_added':
                return self._handle_reaction_added_event(event_data, team_id, api_app_id, channel_id)

            elif event_type == 'reaction_removed':
                return self._handle_reaction_removed_event(event_data, team_id, api_app_id, channel_id)

            elif event_type == 'file_created':
                return self._handle_file_created_event(event_data, team_id, api_app_id, channel_id)

            elif event_type == 'file_shared':
                return self._handle_file_shared_event(event_data, team_id, api_app_id, channel_id)

            else:
                # Generic handler for unknown event types
                return self._handle_generic_event(event_type, event_data, team_id, api_app_id, channel_id)

        except Exception as e:
            logger.error(f"Error processing event: {str(e)}", exc_info=True)
            log_error(f"Slack Event Handler - {event_type}", str(e))
            return {
                'status': 'error',
                'message': str(e)
            }

    def _handle_message_event(
          self,
          event_data: Dict[str, Any],
          team_id: str,
          api_app_id: str,
          channel_id: str
      ) -> Dict[str, Any]:
          """
          Handle message events (message.channels, message.groups, message.im, message.mpim)

          Args:
              event_data: The message event data
              team_id: The Slack workspace ID
              api_app_id: The Slack app ID
              channel_id: The channel ID where message was posted

          Returns:
              dict: Result with status and message
          """
          try:
              # Extract message details
              message_text = event_data.get('text', '')
              user_id = event_data.get('user', 'unknown')
              message_ts = event_data.get('ts', 'unknown')
              subtype = event_data.get('subtype', None)

              # Ignore bot messages and message changes to prevent loops
              if subtype in ['bot_message', 'message_changed', 'message_deleted']:
                  logger.info(f"Ignoring message subtype: {subtype}")
                  return {'status': 'success', 'message': 'Ignored bot/system message'}

              # **NEW: Route messages with trigger code to signup automation module**
              trigger_code = os.getenv('SIGNUP_TRIGGER_CODE', '__SIGNUP_TRIGGER_EXECUTE__')
              signup_channel = os.getenv('SLACK_SIGNUP_CHANNEL', '')

              # Check if message contains trigger code AND is in signup channel
              if trigger_code in message_text and (not signup_channel or channel_id == signup_channel):
                  logger.info(f"🔥 Trigger code '{trigger_code}' detected in channel {channel_id}, routing to signup module")
                  try:
                      from modules.signup_automation_zap.routes import handle_signup_message
                      result = handle_signup_message(event_data)
                      logger.info(f"Signup module result: {result}")
                      return {
                          'status': 'success',
                          'message': 'Routed to signup automation module'
                      }
                  except Exception as e:
                      logger.error(f"Error routing to signup module: {str(e)}", exc_info=True)
                      log_error("Signup Routing", f"Failed to route to signup module: {str(e)}")
                      # Fall through to normal processing if signup module fails

              logger.info(
                  f"Message event: channel={channel_id}, user={user_id}, "
                  f"text='{message_text[:50]}...', ts={message_ts}"
              )

              # Log successful message receipt
              log_success(
                  f"Slack Message Received - Channel: {channel_id}, "
                  f"User: {user_id}, Team: {team_id}"
              )

              # TODO: Add custom message processing logic here
              # For now, just log the event
              self._log_event_to_file(
                  event_type='message',
                  event_data=event_data,
                  team_id=team_id,
                  api_app_id=api_app_id,
                  channel_id=channel_id
              )

              return {
                  'status': 'success',
                  'message': f'Message event processed for channel {channel_id}'
              }

          except Exception as e:
              logger.error(f"Error handling message event: {str(e)}", exc_info=True)
              return {'status': 'error', 'message': str(e)}

    def _handle_app_mention_event(
        self,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle app mention events (when bot is @mentioned)"""
        try:
            message_text = event_data.get('text', '')
            user_id = event_data.get('user', 'unknown')

            logger.info(f"App mention: channel={channel_id}, user={user_id}, text='{message_text}'")

            log_success(f"Slack App Mention - Channel: {channel_id}, User: {user_id}")

            self._log_event_to_file('app_mention', event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': 'App mention processed'}

        except Exception as e:
            logger.error(f"Error handling app mention: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_reaction_added_event(
        self,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle reaction added events"""
        try:
            reaction = event_data.get('reaction', 'unknown')
            user_id = event_data.get('user', 'unknown')
            item_user = event_data.get('item_user', 'unknown')

            logger.info(
                f"Reaction added: reaction={reaction}, user={user_id}, "
                f"item_user={item_user}, channel={channel_id}"
            )

            log_success(f"Slack Reaction Added - {reaction} by {user_id}")

            self._log_event_to_file('reaction_added', event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': 'Reaction added processed'}

        except Exception as e:
            logger.error(f"Error handling reaction added: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_reaction_removed_event(
        self,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle reaction removed events"""
        try:
            reaction = event_data.get('reaction', 'unknown')
            user_id = event_data.get('user', 'unknown')

            logger.info(f"Reaction removed: reaction={reaction}, user={user_id}, channel={channel_id}")

            self._log_event_to_file('reaction_removed', event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': 'Reaction removed processed'}

        except Exception as e:
            logger.error(f"Error handling reaction removed: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_file_created_event(
        self,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle file created events"""
        try:
            file_id = event_data.get('file_id', 'unknown')
            user_id = event_data.get('user_id', 'unknown')

            logger.info(f"File created: file_id={file_id}, user={user_id}")

            log_success(f"Slack File Created - File: {file_id}, User: {user_id}")

            self._log_event_to_file('file_created', event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': 'File created processed'}

        except Exception as e:
            logger.error(f"Error handling file created: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_file_shared_event(
        self,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle file shared events"""
        try:
            file_id = event_data.get('file_id', 'unknown')
            user_id = event_data.get('user_id', 'unknown')

            logger.info(f"File shared: file_id={file_id}, user={user_id}, channel={channel_id}")

            log_success(f"Slack File Shared - File: {file_id}, Channel: {channel_id}")

            self._log_event_to_file('file_shared', event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': 'File shared processed'}

        except Exception as e:
            logger.error(f"Error handling file shared: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _handle_generic_event(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ) -> Dict[str, Any]:
        """Handle any generic/unknown event types"""
        try:
            logger.info(f"Generic event handler: type={event_type}, channel={channel_id}")

            log_success(f"Slack Event Received - Type: {event_type}, Channel: {channel_id}")

            self._log_event_to_file(event_type, event_data, team_id, api_app_id, channel_id)

            return {'status': 'success', 'message': f'{event_type} event logged'}

        except Exception as e:
            logger.error(f"Error handling generic event: {str(e)}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def _log_event_to_file(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        team_id: str,
        api_app_id: str,
        channel_id: str
    ):
        """
        Log event details to a file for debugging and auditing

        Args:
            event_type: The type of event
            event_data: The event data
            team_id: The Slack workspace ID
            api_app_id: The Slack app ID
            channel_id: The channel ID
        """
        try:
            # Create logs directory if it doesn't exist
            log_dir = os.path.join(os.path.dirname(__file__), '../../logs/slack_events')
            os.makedirs(log_dir, exist_ok=True)

            # Create log file path
            log_file = os.path.join(log_dir, f'events_{team_id}.log')

            # Prepare log entry
            log_entry = {
                'event_type': event_type,
                'team_id': team_id,
                'api_app_id': api_app_id,
                'channel_id': channel_id,
                'event_data': event_data
            }

            # Append to log file
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')

            logger.debug(f"Event logged to file: {log_file}")

        except Exception as e:
            logger.error(f"Error logging event to file: {str(e)}", exc_info=True)
