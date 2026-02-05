from django import forms
from .models import LayerStyle
from .widgets import ColorPickerWidget

class LayerStyleForm(forms.ModelForm):
    class Meta:
        model = LayerStyle
        fields = '__all__'
        widgets = {
            'fill_color': ColorPickerWidget(),
            'stroke_color': ColorPickerWidget(),
        }
