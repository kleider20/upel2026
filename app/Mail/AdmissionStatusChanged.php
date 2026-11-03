<?php

namespace App\Mail;

use App\Enums\AdmissionStatus;
use App\Models\Admission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionStatusChanged extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Admission $admission,
        public AdmissionStatus $previousStatus,
        public ?string $note = null,
    ) {}

    /**
     * Asunto según el nuevo estado.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tu solicitud '.$this->admission->code.' está '.mb_strtolower($this->admission->statusLabel()),
        );
    }

    /**
     * Contenido del correo.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admissions.status-changed',
            with: [
                'admission' => $this->admission,
                'previousStatus' => $this->previousStatus,
                'note' => $this->note,
                'trackingUrl' => $this->admission->trackingUrl(
                    (int) config('admissions.tracking_days'),
                ),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
