<?php

namespace App\Notifications;

use App\Models\Schedule;
use Illuminate\Notifications\Notification;

class SchedulePublishedNotification extends Notification
{
    /**
     * Create a notification for the published schedule.
     */
    public function __construct(private readonly Schedule $schedule) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, int|string>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Horario de clases',
            'message' => 'Se ha publicado tu horario de clases.',
            'schedule_id' => $this->schedule->id,
            'destination' => 'horario',
        ];
    }
}
