from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape


class Renderer:
    def __init__(self, templates_dir: str | Path = "templates"):
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml", "j2"]),
        )

    def render(self, template: str, data: dict) -> tuple[str, str]:
        html = self.env.get_template(f"{template}/html.j2").render(**data)
        text = self.env.get_template(f"{template}/text.j2").render(**data)
        return html, text
