from channels.generic.websocket import AsyncWebsocketConsumer

import json


class NotificationConsumer(
    AsyncWebsocketConsumer
):

    async def connect(self):

        self.room_group_name = "notifications"

        await self.channel_layer.group_add(

            self.room_group_name,

            self.channel_name
        )

        await self.accept()

        await self.send(

            text_data=json.dumps({

                "message": "WebSocket Connected"
            })
        )

    async def disconnect(
        self,
        close_code
    ):

        await self.channel_layer.group_discard(

            self.room_group_name,

            self.channel_name
        )

    async def send_notification(
        self,
        event
    ):

        await self.send(

            text_data=json.dumps({

                "message": event["message"]
            })
        )