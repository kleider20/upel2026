<?php

namespace App\Mail;

use App\Models\Admission;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdmissionReceived extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Admission $admission) {}

    /**
     * Asunto del correo de confirmación.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recibimos tu solicitud de preinscripción · '.$this->admission->code,
        );
    }

    /**
     * Contenido del correo.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admissions.received',
            with: [
                'admission' => $this->admission,
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
